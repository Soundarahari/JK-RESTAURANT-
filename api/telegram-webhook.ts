import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side usage with SERVICE ROLE KEY
// The Service Role Key bypasses Row Level Security (RLS) - required for webhooks
// Server-side uses process.env (not import.meta.env which is Vite client-side only)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate environment variables on startup
if (!supabaseUrl) {
  console.error('❌ CRITICAL: Missing SUPABASE_URL environment variable.');
}
if (!supabaseServiceRoleKey) {
  console.error('❌ CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY environment variable. This is required to bypass RLS for order status updates.');
}

// Create Supabase client with Service Role Key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// Helper: Edit an existing Telegram message with new text and optional inline keyboard
async function updateTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string,
  inlineKeyboard: Array<Array<{ text: string; callback_data: string }>> = []
) {
  const payload: any = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'Markdown',
  };

  if (inlineKeyboard.length > 0) {
    payload.reply_markup = { inline_keyboard: inlineKeyboard };
  } else {
    // Remove keyboard entirely
    payload.reply_markup = { inline_keyboard: [] };
  }

  const res = await fetch(`${TELEGRAM_API}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Failed to edit Telegram message:', err);
  }
}

// Helper: Send a message to the Delivery Drivers Telegram Group
async function sendToDriverGroup(message: string) {
  const driverGroupChatId = process.env.TELEGRAM_DRIVER_GROUP_CHAT_ID;
  if (!driverGroupChatId) {
    console.warn('TELEGRAM_DRIVER_GROUP_CHAT_ID not set, sending to main chat instead.');
    // Fallback: send to main kitchen chat
    const fallbackChatId = process.env.TELEGRAM_CHAT_ID;
    if (!fallbackChatId) return;
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: fallbackChatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    return;
  }

  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: driverGroupChatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  });
}

// Helper: Answer callback query to dismiss Telegram loading spinner
async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text || 'Done!',
    }),
  });
}

export default async function handler(req: any, res: any) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Telegram sends button clicks as a "callback_query"
    if (req.body?.callback_query) {
      const query = req.body.callback_query;
      const data = query.data as string; // e.g., "prepare_abc123" or "ready_abc123"
      const chatId = query.message.chat.id;
      const messageId = query.message.message_id;
      const callbackQueryId = query.id;

      // ─── Handle "Start Preparing" ───
      if (data.startsWith('prepare_')) {
        const orderId = data.replace('prepare_', '');

        // 1. Update Supabase order status to 'preparing'
        const { error: dbError } = await supabase
          .from('orders')
          .update({ status: 'preparing' })
          .eq('id', orderId);

        if (dbError) {
          console.error('Supabase update error (preparing):', dbError);
          await answerCallbackQuery(callbackQueryId, '❌ DB update failed');
          return res.status(200).send('OK');
        }

        // 2. Edit the Telegram message to show "Preparing" status + "Food Ready" button
        await updateTelegramMessage(
          chatId,
          messageId,
          `*🟡 Order #${orderId.slice(0, 8)}*\n━━━━━━━━━━━━━━━━━━━━\n*Status:* 🟡 Preparing\n\n_Kitchen is working on this order..._`,
          [[{ text: '✅ Food Ready (Send to Driver)', callback_data: `ready_${orderId}` }]]
        );

        await answerCallbackQuery(callbackQueryId, '👨‍🍳 Started preparing!');
      }

      // ─── Handle "Food Ready" ───
      else if (data.startsWith('ready_')) {
        const orderId = data.replace('ready_', '');

        // 1. Update Supabase order status to 'ready'
        const { error: dbError } = await supabase
          .from('orders')
          .update({ status: 'ready' })
          .eq('id', orderId);

        if (dbError) {
          console.error('Supabase update error (ready):', dbError);
          await answerCallbackQuery(callbackQueryId, '❌ DB update failed');
          return res.status(200).send('OK');
        }

        // 2. Edit Telegram message to show "Ready for Pickup" (remove buttons)
        await updateTelegramMessage(
          chatId,
          messageId,
          `*🟢 Order #${orderId.slice(0, 8)}*\n━━━━━━━━━━━━━━━━━━━━\n*Status:* 🟢 Ready for Pickup\n\n_Waiting for driver to pick up..._`,
          []
        );

        // 3. THE HYBRID LINK: Send a message to the Delivery Drivers group
        const appUrl = (process.env.APP_URL || process.env.VERCEL_URL || 'jk-restaurant-dwdp.vercel.app')
          .replace(/^https?:\/\//, '')
          .replace(/\/$/, '');
        
        const driverLink = `https://${appUrl}/driver/${orderId}`;

        await sendToDriverGroup(
          `*🚗 DELIVERY NEEDED!*\n━━━━━━━━━━━━━━━━━━━━\n*Order:* #${orderId.slice(0, 8)}\n\n✅ Food is ready for pickup!\n\n👉 *Tap to start delivery:*\n${driverLink}`
        );

        await answerCallbackQuery(callbackQueryId, '✅ Driver notified!');
      }

      // Always return 200 so Telegram knows we received the callback
      return res.status(200).send('OK');
    }

    // Handle regular messages (e.g., new chat members, etc.) — just acknowledge
    return res.status(200).send('OK');

  } catch (error: any) {
    console.error('Telegram webhook error:', error);
    // Always return 200 to Telegram even on errors to prevent retries
    return res.status(200).send('OK');
  }
}

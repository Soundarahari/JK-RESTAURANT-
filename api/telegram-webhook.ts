import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side usage with SERVICE ROLE KEY
// The Service Role Key bypasses Row Level Security (RLS) - required for webhooks
// Server-side uses process.env (not import.meta.env which is Vite client-side only)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

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
        const { data: orderData, error: dbError } = await supabase
          .from('orders')
          .update({ status: 'preparing' })
          .eq('id', orderId)
          .select('*')
          .single();

        if (dbError || !orderData) {
          console.error('Supabase update error (preparing):', dbError);
          await answerCallbackQuery(callbackQueryId, '❌ DB update failed');
          return res.status(200).send('OK');
        }

        // 2. Rebuild the full message to preserve details for the manager
        const itemsList = orderData.items.map((item: any) => `• ${item.quantity}x ${item.name}`).join('\n');
        const updatedMessage = `*🟡 Order #${orderId.slice(0, 8)}*\n━━━━━━━━━━━━━━━━━━━━\n*Customer:* ${orderData.user_name}\n*Phone:* ${orderData.user_phone}\n*Mode:* ${orderData.order_mode === 'takeaway' ? '🥡 Takeaway' : '🛵 Delivery'}\n\n*Items:*\n${itemsList}\n\n*Total:* ₹${orderData.total_amount}\n━━━━━━━━━━━━━━━━━━━━\n*Status:* 🟡 Preparing\n\n_Kitchen is working on this order..._`;

        await updateTelegramMessage(
          chatId,
          messageId,
          updatedMessage,
          [[{ text: orderData.order_mode === 'takeaway' ? '✅ Food Ready (Takeaway)' : '✅ Food Ready (Send to Driver)', callback_data: `ready_${orderId}` }]]
        );

        await answerCallbackQuery(callbackQueryId, '👨‍🍳 Started preparing!');
      }

      // ─── Handle "Food Ready" ───
      else if (data.startsWith('ready_')) {
        const orderId = data.replace('ready_', '');

        // 1. Update Supabase order status to 'ready'
        const { data: orderData, error: dbError } = await supabase
          .from('orders')
          .update({ status: 'ready' })
          .eq('id', orderId)
          .select('*')
          .single();

        if (dbError || !orderData) {
          console.error('Supabase update error (ready):', dbError);
          await answerCallbackQuery(callbackQueryId, '❌ DB update failed');
          return res.status(200).send('OK');
        }

        // 2. Rebuild full message for manager (remove buttons)
        const itemsList = orderData.items.map((item: any) => `• ${item.quantity}x ${item.name}`).join('\n');
        const updatedMessage = `*🟢 Order #${orderId.slice(0, 8)}*\n━━━━━━━━━━━━━━━━━━━━\n*Customer:* ${orderData.user_name}\n*Phone:* ${orderData.user_phone}\n*Mode:* ${orderData.order_mode === 'takeaway' ? '🥡 Takeaway' : '🛵 Delivery'}\n\n*Items:*\n${itemsList}\n\n*Total:* ₹${orderData.total_amount}\n━━━━━━━━━━━━━━━━━━━━\n*Status:* 🟢 Ready for Pickup\n\n_Waiting for driver to pick up..._`;

        await updateTelegramMessage(chatId, messageId, updatedMessage, []);

        // 3. Send enhanced delivery message directly to the Drivers Telegram group (if delivery)
        const driverGroupChatId = process.env.TELEGRAM_DRIVER_GROUP_CHAT_ID;
        if (driverGroupChatId && orderData.order_mode !== 'takeaway') {
          const driverMessage = `🚨 *NEW DELIVERY JOB!* 🚨\n\n*Order:* #${orderData.id.slice(0, 8)}\n*Customer:* ${orderData.user_name}\n*Phone:* ${orderData.user_phone}\n*Address:* ${orderData.delivery_address || 'N/A'}\n*Total:* ₹${orderData.total_amount}\n\n*Driver, click here to start delivery:*\nhttps://jk-restaurant-dwdp.vercel.app/driver/${orderId}`;

          await fetch(`${TELEGRAM_API}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: driverGroupChatId,
              text: driverMessage,
              parse_mode: 'Markdown',
            }),
          });
        }

        await answerCallbackQuery(callbackQueryId, orderData.order_mode === 'takeaway' ? '✅ Marked as Ready!' : '✅ Driver notified!');
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

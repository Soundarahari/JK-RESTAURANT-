import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

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
        const updatedMessage = `*🟢 Order #${orderId.slice(0, 8)}*\n━━━━━━━━━━━━━━━━━━━━\n*Customer:* ${orderData.user_name}\n*Phone:* ${orderData.user_phone}\n*Mode:* ${orderData.order_mode === 'takeaway' ? '🥡 Takeaway' : '🛵 Delivery'}\n\n*Items:*\n${itemsList}\n\n*Total:* ₹${orderData.total_amount}\n━━━━━━━━━━━━━━━━━━━━\n*Status:* 🟢 Ready for Pickup\n\n_${orderData.order_mode === 'takeaway' ? 'Waiting for customer to pick up...' : 'Waiting for driver to pick up...'}_`;

        await updateTelegramMessage(chatId, messageId, updatedMessage, orderData.order_mode === 'takeaway' ? [[{ text: '🛍️ Customer Picked Up', callback_data: `completed_${orderId}` }]] : []);

        // 3. Send Ready Email to Customer (if Takeaway)
        if (orderData.order_mode === 'takeaway' && orderData.user_email && process.env.GMAIL_USER) {
          try {
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
            });
            await transporter.sendMail({
              from: `"JK Restaurant" <${process.env.GMAIL_USER}>`,
              to: orderData.user_email,
              subject: `Your Order is Ready for Pickup! 🥡 - JK Restaurant`,
              html: `
                <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; background-color: #f9fafb;">
                  <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 24px;">Ready for Pickup! 🥡</h1>
                    </div>
                    <div style="padding: 30px;">
                      <p style="font-size: 16px; color: #374151;">Hi <strong>${orderData.user_name}</strong>,</p>
                      <p style="color: #4b5563; line-height: 1.6; font-size: 15px;">Great news! Your takeaway order is perfectly packed and ready to be picked up at the restaurant. See you soon!</p>
                      <div style="text-align: center; margin-top: 30px;">
                        <a href="https://jk-restaurant-dwdp.vercel.app/track/${orderId}" style="display: inline-block; background-color: #ea580c; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">View Order Details</a>
                      </div>
                    </div>
                  </div>
                </div>
              `
            });
            console.log(`Ready Email sent to ${orderData.user_email}`);
          } catch (e) {
            console.error("Failed to send Ready email:", e);
          }
        }

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

      // ─── Handle "Order Completed" (Takeaway) ───
      else if (data.startsWith('completed_')) {
        const orderId = data.replace('completed_', '');

        // 1. Update Supabase order status to 'completed'
        const { data: orderData, error: dbError } = await supabase
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', orderId)
          .select('*')
          .single();

        if (dbError || !orderData) {
          console.error('Supabase update error (completed):', dbError);
          await answerCallbackQuery(callbackQueryId, '❌ DB update failed');
          return res.status(200).send('OK');
        }

        // 2. Rebuild full message for manager (remove buttons)
        const itemsList = orderData.items.map((item: any) => `• ${item.quantity}x ${item.name}`).join('\n');
        const updatedMessage = `*🏆 Order #${orderId.slice(0, 8)}*\n━━━━━━━━━━━━━━━━━━━━\n*Customer:* ${orderData.user_name}\n*Phone:* ${orderData.user_phone}\n*Mode:* ${orderData.order_mode === 'takeaway' ? '🥡 Takeaway' : '🛵 Delivery'}\n\n*Items:*\n${itemsList}\n\n*Total:* ₹${orderData.total_amount}\n━━━━━━━━━━━━━━━━━━━━\n*Status:* 🏆 Completed\n\n_Order has been successfully picked up._`;

        await updateTelegramMessage(chatId, messageId, updatedMessage, []);

        await answerCallbackQuery(callbackQueryId, '🎉 Order Completed!');
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

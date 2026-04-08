import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Initialize Supabase with SERVICE ROLE KEY to bypass RLS
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  console.error('[DRIVER-UPDATE] ❌ Missing SUPABASE_URL');
}
if (!supabaseServiceRoleKey) {
  console.error('[DRIVER-UPDATE] ❌ Missing SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default async function handler(req: any, res: any) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, newStatus, driverLocation } = req.body;

    // Validate required fields
    if (!orderId || !newStatus) {
      console.error('[DRIVER-UPDATE] ❌ Missing orderId or newStatus in request body');
      return res.status(400).json({ error: 'Missing orderId or newStatus' });
    }

    // Validate allowed statuses
    const allowedStatuses = ['out_for_delivery', 'completed'];
    if (!allowedStatuses.includes(newStatus)) {
      console.error('[DRIVER-UPDATE] ❌ Invalid status:', newStatus);
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    console.log(`[DRIVER-UPDATE] Updating order ${orderId} to status: ${newStatus}`);

    // Build the update payload
    const updatePayload: any = { status: newStatus };

    // If marking as completed, clear driver_location
    if (newStatus === 'completed') {
      updatePayload.driver_location = null;
    }

    // If driver_location is provided (for GPS tracking updates), include it
    if (driverLocation) {
      updatePayload.driver_location = driverLocation;
    }

    // Fetch current state to avoid duplicate emails/notifications on GPS loops
    const { data: currentData } = await supabase.from('orders').select('status, user_name, user_email').eq('id', orderId).single();
    const isStatusChanging = currentData?.status !== newStatus;

    const { error: dbError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (dbError) {
      console.error('[DRIVER-UPDATE] ❌ Supabase error:', dbError);
      return res.status(500).json({ error: 'Database update failed', details: dbError.message });
    }

    console.log(`[DRIVER-UPDATE] ✅ Order ${orderId} updated to ${newStatus}`);

    // Send Out for Delivery Email and Telegram Notification ONLY if status just changed
    if (newStatus === 'out_for_delivery' && isStatusChanging) {
      try {
        if (currentData?.user_email && process.env.GMAIL_USER) {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
          });
          await transporter.sendMail({
            from: `"JK Restaurant" <${process.env.GMAIL_USER}>`,
            to: currentData.user_email,
            subject: `Your Order is Out for Delivery! 🛵 - JK Restaurant`,
            html: `
              <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px 20px; background-color: #f9fafb;">
                <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Out for Delivery! 🛵</h1>
                  </div>
                  <div style="padding: 30px;">
                    <p style="font-size: 16px; color: #374151;">Hi <strong>${currentData.user_name}</strong>,</p>
                    <p style="color: #4b5563; line-height: 1.6; font-size: 15px;">Your delicious food is on its way to you! You can track your driver live in the JK Restaurant app.</p>
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="https://jk-restaurant-dwdp.vercel.app/track/${orderId}" style="display: inline-block; background-color: #ea580c; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">Track Driver Live</a>
                    </div>
                  </div>
                </div>
              </div>
            `
          });
          console.log(`Out for Delivery email sent to ${currentData.user_email}`);
        }
        
        // Notify Manager Bot
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
          const managerMsg = `🛵 *Driver Picked Up Delivery!*\n\n*Order:* #${orderId.slice(0, 8)}\n*Customer:* ${currentData?.user_name || 'N/A'}\n*Driver is now on the way.*`;
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: managerMsg, parse_mode: 'Markdown' })
          });
        }

        // Notify Driver Group
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_DRIVER_GROUP_CHAT_ID) {
          const driverGroupMsg = `✅ *ORDER PICKED UP*\n\nOrder #${orderId.slice(0, 8)} for ${currentData?.user_name} has been accepted and is being delivered.`;
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: process.env.TELEGRAM_DRIVER_GROUP_CHAT_ID, text: driverGroupMsg, parse_mode: 'Markdown' })
          });
        }
      } catch (e) {
        console.error("Failed to send Out for Delivery notifications:", e);
      }
    } else if (newStatus === 'completed' && isStatusChanging) {
      try {
        // Notify Manager Bot
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
          const managerMsg = `🏆 *Delivery Completed!*\n\n*Order:* #${orderId.slice(0, 8)}\n*Customer:* ${currentData?.user_name || 'N/A'}\n*Successfully delivered.*`;
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: managerMsg, parse_mode: 'Markdown' })
          });
        }

        // Notify Driver Group
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_DRIVER_GROUP_CHAT_ID) {
          const driverGroupMsg = `🏁 *DELIVERY COMPLETE*\n\nOrder #${orderId.slice(0, 8)} has been delivered! Job well done.`;
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: process.env.TELEGRAM_DRIVER_GROUP_CHAT_ID, text: driverGroupMsg, parse_mode: 'Markdown' })
          });
        }
      } catch (e) {
        console.error("Failed to send Completed notification:", e);
      }
    }

    return res.status(200).json({ success: true, orderId, newStatus });

  } catch (err: any) {
    console.error('[DRIVER-UPDATE] ❌ Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Only POST requests are accepted.' });
  }

  // Simple security check using an API secret token
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.ORDER_NOTIFICATION_SECRET || 'test-secret-key';
  
  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    console.error('Unauthorized notification attempt');
    return res.status(401).json({ error: 'Unauthorized. Invalid or missing Bearer token.' });
  }

  try {
    const { orderId, items, totalAmount, customerContact, deliveryAddress, status, isUpdate } = req.body || {};

    // Validate required fields
    if (!orderId || !items || totalAmount === undefined || !customerContact || !customerContact.email) {
      console.error('Missing required fields in order notification payload');
      return res.status(400).json({ 
        error: 'Missing required fields. Please ensure orderId, items, totalAmount, and customerContact with email are provided.' 
      });
    }

    // Configure Nodemailer transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Subject and Header based on status
    let subject = `Receipt for Order #${orderId} - JK Restaurant`;
    let headerText = 'Order Confirmed!';
    let bodyText = 'Thank you for your order! Our kitchen is already preparing your delicious food. Below is the summary of your order.';
    let headerColor = 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)';

    if (isUpdate) {
      switch (status) {
        case 'preparing':
          subject = `Update: Your Order #${orderId} is being prepared! 🍳`;
          headerText = 'Chef is Cooking!';
          bodyText = 'Great news! Our chef has started preparing your dish with fresh ingredients.';
          break;
        case 'ready':
          subject = `Update: Your Order #${orderId} is ready! 🎉`;
          headerText = 'Ready for Pickup!';
          bodyText = 'Your order is hot and ready. If you chose takeaway, you can head over now!';
          break;
        case 'out_for_delivery':
          subject = `Update: Your Order #${orderId} is out for delivery! 🛵`;
          headerText = 'On the Way!';
          bodyText = 'Your food has left the kitchen and our driver is speeding towards you!';
          headerColor = 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)';
          break;
        case 'completed':
          subject = `Order #${orderId} Completed - Hope you enjoyed! ❤️`;
          headerText = 'Enjoy your Meal!';
          bodyText = 'Your order has been marked as completed. We hope you enjoyed every bite!';
          headerColor = 'linear-gradient(135deg, #10b981 0%, #047857 100%)';
          break;
        default:
          subject = `Update on Order #${orderId}`;
          headerText = `Order is ${status}`;
      }
    }

    // Create HTML for the items list (table format)
    const itemsHtml = items.map((item: any) => 
      `<tr>
         <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
           <span style="font-weight: 600; color: #1f2937;">${item.quantity}x ${item.name}</span>
         </td>
         <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; color: #4b5563; font-weight: 500;">
           ₹${Number(item.price * item.quantity).toFixed(2)}
         </td>
       </tr>`
    ).join('');
    
    // Construct the mail options
    const mailOptions = {
        from: `"JK Restaurant" <${process.env.GMAIL_USER}>`,
        to: customerContact.email,
        subject: subject,
        html: `
          <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; background-color: #f9fafb; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
              
              <!-- Header -->
              <div style="background: ${headerColor}; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">JK Restaurant</h1>
                <p style="color: #ffffff; opacity: 0.9; margin: 10px 0 0 0; font-size: 16px;">${headerText}</p>
              </div>
              
              <!-- Body -->
              <div style="padding: 30px 40px;">
                <p style="color: #374151; font-size: 16px; margin-top: 0;">Hi <strong>${customerContact.name || 'there'}</strong>,</p>
                <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">${bodyText}</p>
                
                <div style="margin-top: 30px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6; padding: 20px;">
                  <h3 style="margin-top: 0; color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Order Summary #${orderId}</h3>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style="padding-top: 15px; text-align: right; font-weight: 600; color: #374151; font-size: 16px;">Total Amount:</td>
                        <td style="padding-top: 15px; text-align: right; font-weight: 700; color: #ea580c; font-size: 18px;">
                          ₹${Number(totalAmount).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                  <h4 style="margin: 0 0 10px 0; color: #111827; font-size: 14px;">Order Details:</h4>
                  <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
                    📍 Address: ${deliveryAddress || 'Takeaway'}<br/>
                    📞 Contact: ${customerContact.phone || 'N/A'}<br/>
                    🔄 Current Status: <strong>${status || 'Updated'}</strong>
                  </p>
                </div>
                
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center;">
                  Track your live order status in the app!
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #9ca3af; font-size: 13px;">&copy; ${new Date().getFullYear()} JK Restaurant. All rights reserved.</p>
            </div>
          </div>
        `
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${customerContact.email} for status update to ${status}`);

    // Send Telegram Notification for Status Update
    try {
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        let statusEmoji = 'ℹ️';
        if (status === 'preparing') statusEmoji = '👨‍🍳';
        if (status === 'ready') statusEmoji = '✅';
        if (status === 'out_for_delivery') statusEmoji = '🛵';
        if (status === 'completed') statusEmoji = '🌟';
        if (status === 'cancelled') statusEmoji = '❌';

        let telegramMessage = `*${statusEmoji} ORDER STATUS UPDATE ${statusEmoji}*\n`;
        telegramMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
        telegramMessage += `*Order ID:* \`#${orderId}\`\n`;
        telegramMessage += `*Customer:* 👤 ${customerContact.name || 'N/A'}\n`;
        telegramMessage += `*New Status:* *${status.toUpperCase()}*\n`;
        telegramMessage += `━━━━━━━━━━━━━━━━━━━━\n`;
        
        if (isUpdate && status === 'out_for_delivery') {
          telegramMessage += `🛵 Driver is on the way to the customer!\n`;
        }

        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: telegramMessage,
            parse_mode: 'Markdown',
          }),
        });
      }
    } catch (telegramError) {
      console.error('Failed to send Telegram status update:', telegramError);
    }

    return res.status(200).json({ 
      success: true, 
      message: `Status update email sent to ${customerContact.email}.`
    });

  } catch (error: any) {
    console.error('Error processing order status notification:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error processing notification.',
      details: error.message 
    });
  }
}

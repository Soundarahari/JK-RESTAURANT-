import nodemailer from 'nodemailer';

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
    const { orderId, items, totalAmount, customerContact } = req.body || {};

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

    // Create HTML for the items list
    const itemsHtml = items.map((item: any) => 
      `<li style="margin-bottom: 8px;">
         <strong>${item.quantity}x ${item.name}</strong> - $${Number(item.price * item.quantity).toFixed(2)}
       </li>`
    ).join('');
    
    // Construct the mail options
    const mailOptions = {
        from: `"JK Restaurant" <${process.env.GMAIL_USER}>`,
        to: customerContact.email,
        subject: `Receipt for your order ${orderId}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #fafafa;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #ea580c; margin: 0;">Thank you for your order!</h2>
            </div>
            <p>Hi ${customerContact.name || 'there'},</p>
            <p>We've received your order and our kitchen is preparing it now. Below is a copy of your receipt.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #eee; margin-top: 20px;">
              <h3 style="margin-top: 0;">Order Details (${orderId})</h3>
              <hr style="border: 0; border-top: 1px solid #eee;" />
              <ul style="list-style-type: none; padding: 0;">
                ${itemsHtml}
              </ul>
              <hr style="border: 0; border-top: 1px solid #eee;" />
              <h3 style="text-align: right;">Total: $${Number(totalAmount).toFixed(2)}</h3>
            </div>
            
            <p style="margin-top: 20px;">If you have any questions, feel free to reply to this email.</p>
            <br/>
            <p>Best regards,<br/><strong>The JK Restaurant Team</strong></p>
          </div>
        `
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${customerContact.email} for order ${orderId}`);

    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: `Order receipt emailed to ${customerContact.email} successfully.`
    });

  } catch (error: any) {
    console.error('Error processing order notification and sending email:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error processing notification.',
      details: error.message 
    });
  }
}

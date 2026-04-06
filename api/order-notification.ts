export default function handler(req: any, res: any) {
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
    // req.body is automatically parsed by Vercel if "Content-Type: application/json" is set
    const { orderId, items, totalAmount, customerContact } = req.body || {};

    // Validate required fields
    if (!orderId || !items || totalAmount === undefined || !customerContact) {
      console.error('Missing required fields in order notification payload');
      return res.status(400).json({ 
        error: 'Missing required fields. Please ensure orderId, items, totalAmount, and customerContact are provided.' 
      });
    }

    // Log the valid data
    console.log('=== Incoming Order Notification ===');
    console.log(`Order ID: ${orderId}`);
    console.log(`Total Amount: $${totalAmount}`);
    console.log('Customer Contact:', JSON.stringify(customerContact));
    console.log('Items:', JSON.stringify(items, null, 2));
    console.log('===================================');

    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: `Order notification for ${orderId} received successfully.`
    });

  } catch (error) {
    console.error('Error processing order notification:', error);
    return res.status(500).json({ error: 'Internal Server Error processing notification.' });
  }
}

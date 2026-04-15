import Razorpay from 'razorpay';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { amount } = req.body;
  
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid amount provided' });
  }

  // Get keys from environment
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.error('Razorpay keys missing from environment');
    return res.status(500).json({ error: 'Payment gateway configuration is incomplete on the server.' });
  }

  try {
    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      payment_capture: 1 // auto-capture payment upon successful authorization
    };

    const order = await razorpay.orders.create(options);
    
    // Send public key down so frontend has it automatically without exposing secret
    return res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: key_id
    });
  } catch (error: any) {
    console.error('Razorpay Error:', error);
    return res.status(500).json({ error: error?.description || error?.message || 'Failed to generate order signature.' });
  }
}

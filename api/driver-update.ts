import { createClient } from '@supabase/supabase-js';

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

    const { error: dbError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (dbError) {
      console.error('[DRIVER-UPDATE] ❌ Supabase error:', dbError);
      return res.status(500).json({ error: 'Database update failed', details: dbError.message });
    }

    console.log(`[DRIVER-UPDATE] ✅ Order ${orderId} updated to ${newStatus}`);
    return res.status(200).json({ success: true, orderId, newStatus });

  } catch (err: any) {
    console.error('[DRIVER-UPDATE] ❌ Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

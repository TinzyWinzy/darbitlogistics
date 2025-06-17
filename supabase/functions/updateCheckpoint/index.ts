import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  const { trackingId, checkpoint, currentStatus } = await req.json();

  // 1. Fetch delivery
  const { data: delivery, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('trackingId', trackingId)
    .single();

  if (error || !delivery) {
    return new Response(JSON.stringify({ error: 'Delivery not found' }), { status: 404 });
  }

  // 2. Append checkpoint
  const newCheckpoint = {
    ...checkpoint,
    timestamp: new Date().toISOString(),
  };
  const updatedCheckpoints = [...(delivery.checkpoints || []), newCheckpoint];

  // 3. Update status
  const { error: updateError } = await supabase
    .from('deliveries')
    .update({
      checkpoints: updatedCheckpoints,
      currentStatus,
    })
    .eq('trackingId', trackingId);

  if (updateError) {
    return new Response(JSON.stringify({ error: 'Failed to update delivery' }), { status: 500 });
  }

  // 4. Format SMS
  const smsMessage = `Update: Your delivery (${trackingId}) is now at ${checkpoint.location}. Status: ${currentStatus}.`;

  // 5. Send SMS via Africa's Talking
  const smsRes = await sendSMS(delivery.phoneNumber, smsMessage);

  if (!smsRes.success) {
    return new Response(JSON.stringify({ error: 'Checkpoint updated, but SMS failed', smsError: smsRes.error }), { status: 207 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});

// Helper: Africa's Talking SMS
async function sendSMS(to: string, message: string) {
  const username = Deno.env.get('AT_USERNAME');
  const apiKey = Deno.env.get('AT_API_KEY');
  const senderId = Deno.env.get('AT_SENDER_ID') || 'MorresLogistics';

  const payload = {
    username,
    to,
    message,
    from: senderId,
  };

  const resp = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      'apiKey': apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(payload),
  });

  if (!resp.ok) {
    return { success: false, error: await resp.text() };
  }
  return { success: true };
} 
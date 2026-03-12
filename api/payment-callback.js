// api/payment-callback.js — Billplz webhook (payment confirmation)
// Billplz calls this URL after payment is completed
// Add to vercel.json: "api/payment-callback.js": { "maxDuration": 10 }

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Redirect callback from Billplz after payment
    const { billplz = {}, plan } = req.query;
    // Verify X-Signature (optional but recommended for production)
    // For now just redirect to app with success
    return res.redirect(302, `/?payment=success&plan=${plan || 'pro'}`);
  }

  if (req.method === 'POST') {
    // Webhook from Billplz: payment confirmed
    const {
      'billplz[id]': billId,
      'billplz[paid]': paid,
      'billplz[paid_amount]': paidAmount,
      'billplz[reference_1]': plan,
      'billplz[reference_2]': phone,
    } = req.body || {};

    console.log('Billplz webhook:', { billId, paid, paidAmount, plan, phone });

    if (paid === 'true') {
      // TODO: Update Supabase profiles.plan for this user
      // const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
      // await supabaseAdmin.from('profiles').upsert({ phone, plan, updated_at: new Date() }, { onConflict: 'phone' })
      console.log(`Payment confirmed: ${phone} upgraded to ${plan}`);
    }

    return res.status(200).send('OK');
  }

  return res.status(405).send('Method not allowed');
}

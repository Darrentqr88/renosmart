// api/payment.js — RenoSmart Payment via Billplz
// Deploy to: api/payment.js in GitHub repo
// Required Vercel env vars:
//   BILLPLZ_API_KEY        — from billplz.com → Settings → API Key
//   BILLPLZ_COLLECTION_ID  — from billplz.com → Collections → your collection ID
//   BILLPLZ_SANDBOX        — set to "true" for testing, remove for production
//   NEXT_PUBLIC_APP_URL    — e.g. https://renosmart.vercel.app

const BILLPLZ_BASE = process.env.BILLPLZ_SANDBOX === 'true'
  ? 'https://www.billplz-sandbox.com/api/v3'
  : 'https://www.billplz.com/api/v3';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://renosmart.vercel.app';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY       = process.env.BILLPLZ_API_KEY;
  const COLLECTION_ID = process.env.BILLPLZ_COLLECTION_ID;

  // ── Demo mode: Billplz keys not configured yet ──────────────
  if (!API_KEY || !COLLECTION_ID) {
    console.warn('Billplz keys not configured — running in demo mode');
    return res.status(200).json({
      demo: true,
      message: 'Payment gateway not configured yet. Running in demo mode.'
    });
  }

  const { plan, amount, email, phone, method } = req.body || {};

  if (!plan || !amount) {
    return res.status(400).json({ error: 'Missing plan or amount' });
  }

  const planLabels = { pro: 'RenoSmart Pro (1 Month)', elite: 'RenoSmart Elite (1 Month)' };
  const description = planLabels[plan] || 'RenoSmart Subscription';

  // ── Create Billplz Bill ───────────────────────────────────────
  // Amount in cents (RM 99 = 9900)
  const amountCents = Math.round(parseFloat(amount) * 100);

  const billBody = new URLSearchParams({
    collection_id:    COLLECTION_ID,
    description:      description,
    email:            email || 'customer@renosmart.my',
    mobile:           phone  || '',
    name:             phone  || 'RenoSmart User',
    amount:           String(amountCents),
    callback_url:     `${APP_URL}/api/payment-callback`,
    redirect_url:     `${APP_URL}/?payment=success&plan=${plan}`,
    'reference_1_label': 'Plan',
    'reference_1':       plan,
    'reference_2_label': 'Phone',
    'reference_2':       phone || '',
  });

  try {
    const response = await fetch(`${BILLPLZ_BASE}/bills`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(API_KEY + ':').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: billBody.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Billplz error:', data);
      return res.status(response.status).json({ error: data?.error?.message || 'Billplz error' });
    }

    // Return the Billplz payment URL
    return res.status(200).json({
      url:    data.url,          // redirect user here to pay
      billId: data.id,
      plan,
      amount: amountCents / 100,
    });

  } catch (err) {
    console.error('Payment handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}

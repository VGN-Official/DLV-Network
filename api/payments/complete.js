export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { paymentId, txid } = req.body || {};
  if (!paymentId || !txid) return res.status(400).json({ success: false, error: 'Missing paymentId or txid' });

  try {
    const r = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${process.env.PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    });
    const data = await r.json();
    return res.status(r.ok ? 200 : r.status).json({ success: r.ok, data });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

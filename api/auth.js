export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { accessToken } = req.body || {};
  if (!accessToken) return res.status(400).json({ success: false, error: 'Missing accessToken' });

  try {
    const r = await fetch('https://api.minepi.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!r.ok) return res.status(401).json({ success: false, error: 'Invalid Pi access token' });
    const user = await r.json();
    return res.status(200).json({ success: true, user });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { redis } from '../../src/_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { paymentId, txid, username } = req.body;
  if (!paymentId || !txid) {
    return res.status(400).json({ error: "Missing completion execution tokens" });
  }

  try {
    // Post the transaction ID to officially close out the transaction on the blockchain network
    const piResponse = await axios.post(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
      { txid },
      {
        headers: { Authorization: `Key ${process.env.PI_API_KEY}` }
      }
    );

    // BUSINESS LOGIC: Credit the user inside Upstash Redis for their payment
    if (username) {
      const storageKey = `user:${username.toLowerCase()}`;
      const profileRaw = await redis.get(storageKey);
      
      if (profileRaw) {
        const profile = typeof profileRaw === 'string' ? JSON.parse(profileRaw) : profileRaw;
        profile.piEscrowBalance = (profile.piEscrowBalance || 0) + piResponse.data.amount;
        profile.verifiedGigsCount = (profile.verifiedGigsCount || 0) + 1;
        
        await redis.set(storageKey, JSON.stringify(profile));
      }
    }

    return res.status(200).json({ success: true, payment: piResponse.data });
  } catch (err: any) {
    console.error("Payment Completion Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Could not complete transaction record." });
  }
}
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { paymentId } = req.body;
  if (!paymentId) {
    return res.status(400).json({ error: "Missing paymentId parameters" });
  }

  try {
    // Tell Pi Network that our server approves processing this transaction ID
    const piResponse = await axios.post(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {},
      {
        headers: { Authorization: `Key ${process.env.PI_API_KEY}` }
      }
    );

    return res.status(200).json({ success: true, payment: piResponse.data });
  } catch (err: any) {
    console.error("Payment Approval Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Could not approve transaction on server." });
  }
}
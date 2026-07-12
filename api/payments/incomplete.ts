import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { payment } = req.body;
  if (!payment || !payment.identifier) {
    return res.status(400).json({ error: "Invalid incomplete structural argument" });
  }

  const paymentId = payment.identifier;

  try {
    // If the transaction has already hit the block registry, finalize it right now
    if (payment.transaction && payment.transaction.txid) {
      await axios.post(
        `https://api.minepi.com/v2/payments/${paymentId}/complete`,
        { txid: payment.transaction.txid },
        { headers: { Authorization: `Key ${process.env.PI_API_KEY}` } }
      );
      return res.status(200).json({ status: "resolved_and_completed" });
    } 
    
    // Otherwise, cancel it cleanly so the user's wallet is instantly unlocked
    await axios.post(
      `https://api.minepi.com/v2/payments/${paymentId}/cancel`,
      {},
      { headers: { Authorization: `Key ${process.env.PI_API_KEY}` } }
    );
    
    return res.status(200).json({ status: "cancelled_and_cleared" });

  } catch (err: any) {
    console.error("Incomplete Settlement Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to settle the trapped transaction state." });
  }
}
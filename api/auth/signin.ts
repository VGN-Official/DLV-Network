import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { redis } from '../../src/_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { authResult } = req.body;
  if (!authResult || !authResult.accessToken) {
    return res.status(400).json({ error: "Missing authentication token details." });
  }

  try {
    // 1. Verify the access token directly with official Pi Network API
    const piResponse = await axios.get('https://api.minepi.com/v2/me', {
      headers: { Authorization: `Bearer ${authResult.accessToken}` }
    });

    const piUser = piResponse.data; // Contains username, uid, etc.
    const storageKey = `user:${piUser.username.toLowerCase()}`;

    // 2. Build the profile structure for Pi-DLV Network
    const userProfile = {
      uid: piUser.uid,
      username: piUser.username,
      roles: ['user'], // default role, can be expanded to 'driver' or 'admin' later
      lastLogin: new Date().toISOString()
    };

    // 3. Save to Upstash Redis database
    await redis.set(storageKey, JSON.stringify(userProfile));

    return res.status(200).json({ success: true, user: userProfile });

  } catch (err: any) {
    console.error("Pi Authentication Error:", err.response?.data || err.message);
    return res.status(500).json({ 
      error: "Failed to securely verify identity with Pi Network.",
      details: err.response?.data || err.message 
    });
  }
}
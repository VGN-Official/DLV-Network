import { redis } from '../../src/_db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Safe JSON parsing handling stringified bodies or raw objects
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: "Invalid JSON payload received." });
      }
    }
    body = body || {};

    // Extract access token safely
    const accessToken = body.accessToken || body.authResult?.accessToken || body.auth?.accessToken;

    if (!accessToken) {
      return res.status(400).json({ 
        error: "Missing authentication token details.",
        receivedBody: body 
      });
    }

    // 1. Verify token directly with Pi Network API using native fetch
    const piResponse = await fetch('https://api.minepi.com/v2/me', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!piResponse.ok) {
      const errorText = await piResponse.text();
      throw new Error(`Pi API returned status ${piResponse.status}: ${errorText}`);
    }

    const piUser = await piResponse.json();

    if (!piUser || !piUser.username) {
      throw new Error("Invalid response structure received from Pi Network API.");
    }

    const storageKey = `user:${piUser.username.toLowerCase()}`;

   // 1. Check if user already exists in Upstash Redis
  const existingData = await redis.get(storageKey);

  let userProfile;

  if (existingData) {
  // Existing user: preserve stats, update last login
  const parsed = typeof existingData === 'string' ? JSON.parse(existingData) : existingData;
  userProfile = {
    ...parsed,
    lastLogin: new Date().toISOString()
  };
} else {
  // New user: Seed initial data
  userProfile = {
    uid: piUser.uid,
    username: piUser.username,
    roles: ['user'],
    verifiedGigs: 3,        // Seed Data
    escrowTotal: 12.50,     // Seed Data
    activeTasks: 2,         // Seed Data
    lastLogin: new Date().toISOString()
  };
}

    // 2. Save to Upstash Redis database
    await redis.set(storageKey, JSON.stringify(userProfile));

    return res.status(200).json({ success: true, user: userProfile });

  } catch (err: any) {
    console.error("Pi Authentication Error Details:", err.message);

    return res.status(500).json({ 
      error: "Failed to securely verify identity with Pi Network.",
      details: err.message
    });
  }
}
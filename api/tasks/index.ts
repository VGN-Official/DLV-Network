import { redis } from '../../src/_db';

export default async function handler(req: any, res: any) {
  // GET: Fetch all active tasks
  if (req.method === 'GET') {
    try {
      // Retrieve stored tasks from Upstash Redis
      const rawTasks = await redis.get('global:tasks');
      const tasks = rawTasks ? (typeof rawTasks === 'string' ? JSON.parse(rawTasks) : rawTasks) : [];
      
      return res.status(200).json({ success: true, tasks });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch tasks", details: err.message });
    }
  }

  // POST: Create a new verification task dynamically
  if (req.method === 'POST') {
    try {
      const { title, location, reward, desc } = req.body;

      if (!title || !reward) {
        return res.status(400).json({ error: "Title and reward are required." });
      }

      const newTask = {
        id: `DLV-${Math.floor(1000 + Math.random() * 9000)}`,
        title,
        location: location || "Global Node",
        reward: parseFloat(reward),
        desc: desc || "Location telemetry validation requested.",
        createdAt: new Date().toISOString()
      };

      // Get existing tasks, append new one, and update Redis
      const rawTasks = await redis.get('global:tasks');
      const tasks = rawTasks ? (typeof rawTasks === 'string' ? JSON.parse(rawTasks) : rawTasks) : [];
      tasks.unshift(newTask);

      await redis.set('global:tasks', JSON.stringify(tasks));

      return res.status(201).json({ success: true, task: newTask });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to create task", details: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
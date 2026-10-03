import { Hono } from 'hono';
import { DatabaseAdapter } from '../db/adapter';

export const settingsRouter = new Hono();

// Get settings
settingsRouter.get('/', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const rows = await db.query('SELECT key, value FROM settings WHERE key NOT LIKE "%hash%" AND key NOT LIKE "%salt%"');
  const result: Record<string, string> = {};
  for (const r of rows) {
    result[r.key] = r.value;
  }
  return c.json(result);
});

// Update settings
settingsRouter.put('/', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const body = await c.req.json();
  const now = Date.now();

  for (const [key, value] of Object.entries(body)) {
    if (key.includes('hash') || key.includes('salt')) continue;
    await db.execute(
      'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
      [key, String(value), now]
    );
  }

  return c.json({ ok: true });
});

import { Context, Next } from 'hono';
import { DatabaseAdapter } from '../db/adapter';
import { verifySessionToken } from '../utils/crypto';

export async function authGuard(c: Context, next: Next) {
  const db = c.get('db') as DatabaseAdapter;
  const jwtSecret = c.get('jwtSecret') as string;

  // Check if master password exists in settings or environment
  const passRow = await db.get('SELECT value FROM settings WHERE key = ?', ['master_password_hash']);
  const envPass = c.env?.MASTER_PASSWORD || process.env.MASTER_PASSWORD;

  if (!passRow && !envPass) {
    return c.json({ error: 'NOT_INITIALIZED', message: '尚未设置访问授权码，请先初始化' }, 403);
  }

  // Check Authorization header or Cookie
  const authHeader = c.req.header('Authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    const cookie = c.req.header('Cookie');
    if (cookie) {
      const match = cookie.match(/cosmo_session=([^;]+)/);
      if (match) token = match[1];
    }
  }

  if (!token) {
    return c.json({ error: 'UNAUTHORIZED', message: '请先输入访问授权码' }, 401);
  }

  const payload = await verifySessionToken(token, jwtSecret);
  if (!payload || !payload.authenticated) {
    return c.json({ error: 'UNAUTHORIZED', message: '授权会话已失效，请重新验证' }, 401);
  }

  c.set('session', payload);
  await next();
}

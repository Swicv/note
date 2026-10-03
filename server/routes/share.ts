import { Hono } from 'hono';
import { DatabaseAdapter } from '../db/adapter';
import { hashPassword, verifyPassword, generateRandomHex } from '../utils/crypto';

export const shareRouter = new Hono();

// --- Public Endpoints ---

// Get share metadata (does not expose content if password-protected)
shareRouter.get('/:slug/meta', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const slug = c.req.param('slug');

  const note = await db.get(
    `SELECT id, title, icon, share_password_hash, share_views, updated_at 
     FROM notes 
     WHERE share_slug = ? AND is_shared = 1 AND is_archived = 0`,
    [slug]
  );

  if (!note) {
    return c.json({ error: 'NOT_FOUND', message: '该分享笔记不存在或已停止分享' }, 404);
  }

  return c.json({
    title: note.title,
    icon: note.icon,
    is_protected: !!note.share_password_hash,
    updated_at: note.updated_at,
    views: note.share_views || 0,
  });
});

// View shared note content (requires note password if protected)
shareRouter.post('/:slug/view', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const slug = c.req.param('slug');
  const { password } = await c.req.json().catch(() => ({ password: '' }));

  const note = await db.get(
    `SELECT id, title, icon, content, share_password_hash, share_password_salt, share_views, updated_at 
     FROM notes 
     WHERE share_slug = ? AND is_shared = 1 AND is_archived = 0`,
    [slug]
  );

  if (!note) {
    return c.json({ error: 'NOT_FOUND', message: '该分享笔记不存在或已停止分享' }, 404);
  }

  // Check password if protected
  if (note.share_password_hash) {
    if (!password) {
      return c.json({ error: 'PASSWORD_REQUIRED', message: '此笔记受密码保护，请输入访问密码' }, 401);
    }

    const isValid = await verifyPassword(password, note.share_password_hash, note.share_password_salt);
    if (!isValid) {
      return c.json({ error: 'INCORRECT_PASSWORD', message: '密码错误，请重新输入' }, 403);
    }
  }

  // Increment views
  await db.execute('UPDATE notes SET share_views = share_views + 1 WHERE id = ?', [note.id]);

  return c.json({
    id: note.id,
    title: note.title,
    icon: note.icon,
    content: note.content,
    updated_at: note.updated_at,
    views: (note.share_views || 0) + 1,
  });
});

// --- Owner Share Management Endpoints ---

export const noteShareManagerRouter = new Hono();

// Toggle share and set/change password for a note
noteShareManagerRouter.post('/:id/share', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const id = c.req.param('id');
  const body = await c.req.json();
  const { is_shared, password, remove_password } = body;

  const note = await db.get('SELECT id, share_slug, share_password_hash, share_password_salt FROM notes WHERE id = ?', [id]);
  if (!note) {
    return c.json({ error: 'NOT_FOUND', message: '笔记不存在' }, 404);
  }

  let slug = note.share_slug;
  if (!slug && is_shared) {
    slug = generateRandomHex(5); // 10 characters clean URL slug
  }

  let hash = note.share_password_hash;
  let salt = note.share_password_salt;

  if (remove_password) {
    hash = null;
    salt = null;
  } else if (password && typeof password === 'string' && password.trim().length > 0) {
    const res = await hashPassword(password.trim());
    hash = res.hash;
    salt = res.salt;
  }

  await db.execute(
    `UPDATE notes 
     SET is_shared = ?, share_slug = ?, share_password_hash = ?, share_password_salt = ?, updated_at = ?
     WHERE id = ?`,
    [is_shared ? 1 : 0, slug, hash, salt, Date.now(), id]
  );

  return c.json({
    ok: true,
    is_shared: !!is_shared,
    share_slug: slug,
    has_share_password: !!hash,
  });
});

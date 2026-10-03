import { Hono } from 'hono';
import { DatabaseAdapter } from '../db/adapter';
import { hashPassword, verifyPassword, signSessionToken, generateRandomHex } from '../utils/crypto';

export const authRouter = new Hono();

// Check system auth status
authRouter.get('/status', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const hashRow = await db.get('SELECT value FROM settings WHERE key = ?', ['master_password_hash']);
  const envPass = c.env?.MASTER_PASSWORD || process.env.MASTER_PASSWORD;
  const lockRow = await db.get('SELECT value FROM settings WHERE key = ?', ['auto_lock_minutes']);
  const titleRow = await db.get('SELECT value FROM settings WHERE key = ?', ['app_title']);

  const initialized = !!hashRow || !!envPass;
  const autoLockMinutes = lockRow ? parseInt(lockRow.value, 10) : 60;
  const appTitle = titleRow ? titleRow.value : 'Cosmo Note';

  return c.json({
    initialized,
    autoLockMinutes,
    appTitle,
    needsEnvSetup: !!envPass && !hashRow,
  });
});

// Setup master access password for the first time
authRouter.post('/setup', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const jwtSecret = c.get('jwtSecret') as string;
  const { password, appTitle } = await c.req.json();

  if (!password || typeof password !== 'string' || password.length < 4) {
    return c.json({ error: 'INVALID_PASSWORD', message: '访问密码长度至少需4位' }, 400);
  }

  const existing = await db.get('SELECT value FROM settings WHERE key = ?', ['master_password_hash']);
  const envPass = c.env?.MASTER_PASSWORD || process.env.MASTER_PASSWORD;

  if (existing) {
    return c.json({ error: 'ALREADY_INITIALIZED', message: '系统已初始化，如需更改请进入设置' }, 400);
  }

  const { hash, salt } = await hashPassword(password);
  const now = Date.now();

  await db.execute('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)', ['master_password_hash', hash, now]);
  await db.execute('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)', ['master_password_salt', salt, now]);
  if (appTitle) {
    await db.execute('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)', ['app_title', appTitle, now]);
  }

  // Create welcoming initial note if no notes exist
  const countRow = await db.get('SELECT COUNT(*) as count FROM notes');
  if (!countRow || countRow.count === 0) {
    const welcomeId = generateRandomHex(8);
    const welcomeContent = `# 🌌 欢迎来到 Cosmo Note (星脉笔记)

这是属于你的极私密、高品质个人知识宇宙。

### 核心亮点
- 🛡️ **思源笔记式轻量安全**：无需繁琐的多用户后台注册，单入口访问授权码保护，打开即用。
- 🔗 **单篇独立密码分享**：点击顶部「分享」按钮，即可为当前笔记生成独立访问链接，并可单独设置访问密码！
- ☁️ **原生双轨部署**：完美支持 **Cloudflare Pages/Workers + D1** 全球零服务器费用直出，以及 **Docker** 本地 NAS/VPS 极速容器化运行。
- ✨ **全键盘沉浸工作流**：
  - 按 \`Cmd/Ctrl + K\` 呼出全知星际搜索
  - 按 \`Cmd/Ctrl + N\` 瞬间新建灵感笔记
  - 支持 **Markdown**、GitHub Callouts、代码高亮、KaTeX 数学公式与大纲目录导航。

---

> [!TIP]
> 试着点击右上角的 **「分享」** 按钮，给这篇笔记设置一个专属密码（例如 \`123456\`），然后在隐身窗口中打开体验！
`;

    await db.execute(
      `INSERT INTO notes (id, parent_id, title, content, icon, is_folder, is_pinned, is_archived, sort_order, created_at, updated_at)
       VALUES (?, NULL, ?, ?, ?, 0, 1, 0, 0, ?, ?)`,
      [welcomeId, '欢迎使用 Cosmo Note', welcomeContent, '🪐', now, now]
    );
  }

  // Issue session token (valid for 30 days)
  const token = await signSessionToken({ authenticated: true, exp: now + 30 * 24 * 3600 * 1000 }, jwtSecret);

  return c.json({
    ok: true,
    token,
    message: '初始化成功，已解锁知识宇宙',
  });
});

// Unlock workspace with master password
authRouter.post('/unlock', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const jwtSecret = c.get('jwtSecret') as string;
  const { password } = await c.req.json();

  if (!password) {
    return c.json({ error: 'MISSING_PASSWORD', message: '请输入访问授权码' }, 400);
  }

  const hashRow = await db.get('SELECT value FROM settings WHERE key = ?', ['master_password_hash']);
  const saltRow = await db.get('SELECT value FROM settings WHERE key = ?', ['master_password_salt']);
  const envPass = c.env?.MASTER_PASSWORD || process.env.MASTER_PASSWORD;

  let isValid = false;

  if (hashRow && saltRow) {
    isValid = await verifyPassword(password, hashRow.value, saltRow.value);
  } else if (envPass) {
    isValid = (password === envPass);
    // If authenticated via env password and no hash in DB, auto-save to DB for persistence
    if (isValid && !hashRow) {
      const { hash, salt } = await hashPassword(password);
      const now = Date.now();
      await db.execute('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)', ['master_password_hash', hash, now]);
      await db.execute('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)', ['master_password_salt', salt, now]);
    }
  } else {
    return c.json({ error: 'NOT_INITIALIZED', message: '系统尚未初始化' }, 400);
  }

  if (!isValid) {
    return c.json({ error: 'INVALID_PASSWORD', message: '访问授权码错误' }, 401);
  }

  const token = await signSessionToken({ authenticated: true, exp: Date.now() + 30 * 24 * 3600 * 1000 }, jwtSecret);

  return c.json({
    ok: true,
    token,
  });
});

// Change master password
authRouter.post('/change-password', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const { currentPassword, newPassword } = await c.req.json();

  if (!newPassword || newPassword.length < 4) {
    return c.json({ error: 'INVALID_PASSWORD', message: '新密码长度至少需要4位' }, 400);
  }

  const hashRow = await db.get('SELECT value FROM settings WHERE key = ?', ['master_password_hash']);
  const saltRow = await db.get('SELECT value FROM settings WHERE key = ?', ['master_password_salt']);
  const envPass = c.env?.MASTER_PASSWORD || process.env.MASTER_PASSWORD;

  let isCurrentValid = false;
  if (hashRow && saltRow) {
    isCurrentValid = await verifyPassword(currentPassword, hashRow.value, saltRow.value);
  } else if (envPass) {
    isCurrentValid = (currentPassword === envPass);
  }

  if (!isCurrentValid) {
    return c.json({ error: 'INCORRECT_CURRENT_PASSWORD', message: '原访问密码错误' }, 401);
  }

  const { hash, salt } = await hashPassword(newPassword);
  const now = Date.now();
  await db.execute('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)', ['master_password_hash', hash, now]);
  await db.execute('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)', ['master_password_salt', salt, now]);

  return c.json({ ok: true, message: '访问密码已更新' });
});

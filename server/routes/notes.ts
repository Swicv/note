import { Hono } from 'hono';
import { DatabaseAdapter } from '../db/adapter';
import { generateRandomHex } from '../utils/crypto';

export const notesRouter = new Hono();

// List all notes metadata for tree
notesRouter.get('/', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const notes = await db.query(`
    SELECT 
      id, parent_id, title, icon, is_folder, is_pinned, is_archived, 
      sort_order, is_shared, share_slug, 
      (share_password_hash IS NOT NULL) AS has_share_password,
      created_at, updated_at
    FROM notes 
    WHERE is_archived = 0
    ORDER BY is_pinned DESC, sort_order ASC, updated_at DESC
  `);

  return c.json(notes);
});

// Full-text search across titles and content
notesRouter.get('/search', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const q = (c.req.query('q') || '').trim();

  if (!q) {
    return c.json([]);
  }

  const queryPattern = `%${q}%`;
  const results = await db.query(
    `SELECT id, parent_id, title, icon, content, updated_at
     FROM notes 
     WHERE (title LIKE ? OR content LIKE ?) AND is_archived = 0
     ORDER BY updated_at DESC LIMIT 20`,
    [queryPattern, queryPattern]
  );

  // Generate snippets with matching context
  const mapped = results.map((item: any) => {
    let snippet = '';
    const content = item.content || '';
    const lowerContent = content.toLowerCase();
    const index = lowerContent.indexOf(q.toLowerCase());

    if (index !== -1) {
      const start = Math.max(0, index - 40);
      const end = Math.min(content.length, index + q.length + 60);
      snippet = (start > 0 ? '...' : '') + content.substring(start, end).replace(/\n/g, ' ') + (end < content.length ? '...' : '');
    } else {
      snippet = content.substring(0, 100).replace(/\n/g, ' ');
    }

    return {
      id: item.id,
      title: item.title,
      icon: item.icon,
      snippet,
      updated_at: item.updated_at,
    };
  });

  return c.json(mapped);
});

// Get single note detail
notesRouter.get('/:id', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const id = c.req.param('id');

  const note = await db.get(
    `SELECT id, parent_id, title, content, icon, is_folder, is_pinned, is_archived, 
            sort_order, is_shared, share_slug, 
            (share_password_hash IS NOT NULL) AS has_share_password,
            share_views, created_at, updated_at
     FROM notes WHERE id = ?`,
    [id]
  );

  if (!note) {
    return c.json({ error: 'NOT_FOUND', message: '笔记不存在或已被删除' }, 404);
  }

  // Fetch tags
  const tags = await db.query(
    `SELECT t.id, t.name, t.color FROM tags t
     JOIN note_tags nt ON t.id = nt.tag_id
     WHERE nt.note_id = ?`,
    [id]
  );

  return c.json({
    ...note,
    tags: tags || [],
  });
});

// Create note
notesRouter.post('/', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const body = await c.req.json();
  const now = Date.now();
  const id = generateRandomHex(8);

  const title = body.title?.trim() || '无标题笔记';
  const content = body.content || '';
  const icon = body.icon || (body.is_folder ? '📁' : '📄');
  const parentId = body.parent_id || null;
  const isFolder = body.is_folder ? 1 : 0;

  // Determine sort_order
  const maxOrderRow = await db.get(
    `SELECT MAX(sort_order) as max_order FROM notes WHERE (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))`,
    [parentId, parentId]
  );
  const sortOrder = (maxOrderRow?.max_order ?? -1) + 1;

  await db.execute(
    `INSERT INTO notes (id, parent_id, title, content, icon, is_folder, is_pinned, is_archived, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`,
    [id, parentId, title, content, icon, isFolder, sortOrder, now, now]
  );

  const newNote = await db.get('SELECT * FROM notes WHERE id = ?', [id]);
  return c.json(newNote, 201);
});

// Update note
notesRouter.put('/:id', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = Date.now();

  const existing = await db.get('SELECT id FROM notes WHERE id = ?', [id]);
  if (!existing) {
    return c.json({ error: 'NOT_FOUND', message: '笔记不存在' }, 404);
  }

  const updates: string[] = ['updated_at = ?'];
  const params: any[] = [now];

  if (body.title !== undefined) {
    updates.push('title = ?');
    params.push(body.title.trim() || '无标题笔记');
  }
  if (body.content !== undefined) {
    updates.push('content = ?');
    params.push(body.content);
  }
  if (body.icon !== undefined) {
    updates.push('icon = ?');
    params.push(body.icon);
  }
  if (body.is_pinned !== undefined) {
    updates.push('is_pinned = ?');
    params.push(body.is_pinned ? 1 : 0);
  }
  if (body.is_folder !== undefined) {
    updates.push('is_folder = ?');
    params.push(body.is_folder ? 1 : 0);
  }
  if (body.is_archived !== undefined) {
    updates.push('is_archived = ?');
    params.push(body.is_archived ? 1 : 0);
  }
  if (body.parent_id !== undefined) {
    updates.push('parent_id = ?');
    params.push(body.parent_id || null);
  }
  if (body.sort_order !== undefined) {
    updates.push('sort_order = ?');
    params.push(body.sort_order);
  }

  params.push(id);
  await db.execute(`UPDATE notes SET ${updates.join(', ')} WHERE id = ?`, params);

  const updatedNote = await db.get(
    `SELECT id, parent_id, title, content, icon, is_folder, is_pinned, is_archived, 
            sort_order, is_shared, share_slug, 
            (share_password_hash IS NOT NULL) AS has_share_password,
            share_views, created_at, updated_at
     FROM notes WHERE id = ?`,
    [id]
  );

  return c.json(updatedNote);
});

// Delete note and recursive children
notesRouter.delete('/:id', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const id = c.req.param('id');

  // Find all children recursively
  const toDelete = [id];
  let cursor = 0;
  while (cursor < toDelete.length) {
    const parentId = toDelete[cursor++];
    const children = await db.query('SELECT id FROM notes WHERE parent_id = ?', [parentId]);
    for (const child of children) {
      toDelete.push(child.id);
    }
  }

  for (const noteId of toDelete) {
    await db.execute('DELETE FROM note_tags WHERE note_id = ?', [noteId]);
    await db.execute('DELETE FROM notes WHERE id = ?', [noteId]);
  }

  return c.json({ ok: true, deleted: toDelete.length });
});

// Batch import notes (supports full backup JSON and batch Markdown files)
notesRouter.post('/import', async (c) => {
  const db = c.get('db') as DatabaseAdapter;
  const body = await c.req.json();
  const now = Date.now();

  const { type = 'markdown', mode = 'merge', notes = [] } = body;

  if (!Array.isArray(notes) || notes.length === 0) {
    return c.json({ error: 'INVALID_DATA', message: '未包含有效的笔记数据' }, 400);
  }

  // If mode is 'overwrite' and type is 'backup', clear existing notes first
  if (mode === 'overwrite' && type === 'backup') {
    await db.execute('DELETE FROM note_tags');
    await db.execute('DELETE FROM notes');
  }

  const importedIds: string[] = [];

  if (type === 'backup') {
    for (const item of notes) {
      if (!item.title && !item.content) continue;
      const noteId = item.id || generateRandomHex(8);
      const parentId = item.parent_id || null;
      const title = item.title || '无标题笔记';
      const content = item.content || '';
      const icon = item.icon || (item.is_folder ? '📁' : '📄');
      const isFolder = item.is_folder ? 1 : 0;
      const isPinned = item.is_pinned ? 1 : 0;
      const isArchived = item.is_archived ? 1 : 0;
      const sortOrder = typeof item.sort_order === 'number' ? item.sort_order : 0;
      const createdAt = item.created_at || now;
      const updatedAt = item.updated_at || now;
      const isShared = item.is_shared ? 1 : 0;
      const shareSlug = item.share_slug || null;

      const existing = await db.get('SELECT id FROM notes WHERE id = ?', [noteId]);
      if (existing) {
        if (mode === 'merge') {
          await db.execute(
            `UPDATE notes SET 
              parent_id = ?, title = ?, content = ?, icon = ?, is_folder = ?, 
              is_pinned = ?, is_archived = ?, sort_order = ?, updated_at = ?
             WHERE id = ?`,
            [parentId, title, content, icon, isFolder, isPinned, isArchived, sortOrder, updatedAt, noteId]
          );
        }
      } else {
        await db.execute(
          `INSERT INTO notes (
            id, parent_id, title, content, icon, is_folder, is_pinned, 
            is_archived, sort_order, is_shared, share_slug, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [noteId, parentId, title, content, icon, isFolder, isPinned, isArchived, sortOrder, isShared, shareSlug, createdAt, updatedAt]
        );
      }
      importedIds.push(noteId);
    }
  } else {
    // Markdown batch import
    for (const item of notes) {
      const noteId = generateRandomHex(8);
      let title = (item.title || '').trim();
      const content = item.content || '';
      const parentId = item.parent_id || null;

      if (!title) {
        const match = content.match(/^#\s+(.+)$/m);
        if (match) {
          title = match[1].trim();
        } else {
          title = '导入的笔记';
        }
      }

      const icon = item.icon || '📄';
      const maxOrderRow = await db.get(
        `SELECT MAX(sort_order) as max_order FROM notes WHERE (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))`,
        [parentId, parentId]
      );
      const sortOrder = (maxOrderRow?.max_order ?? -1) + 1;

      await db.execute(
        `INSERT INTO notes (
          id, parent_id, title, content, icon, is_folder, is_pinned, 
          is_archived, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?)`,
        [noteId, parentId, title, content, icon, sortOrder, now, now]
      );
      importedIds.push(noteId);
    }
  }

  return c.json({
    ok: true,
    count: importedIds.length,
    imported_ids: importedIds,
  });
});


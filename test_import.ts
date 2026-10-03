import Database from 'better-sqlite3';
import fs from 'fs';
import { createCosmoApp } from '/home/dark/note/server/app';
import { SQLiteAdapter } from '/home/dark/note/server/db/sqlite';
import { createSessionToken } from '/home/dark/note/server/utils/crypto';

async function runTest() {
  const db = new Database(':memory:');
  const schema = fs.readFileSync('/home/dark/note/schema.sql', 'utf-8');
  db.exec(schema);

  const adapter = new SQLiteAdapter(db);
  const jwtSecret = 'test-secret-12345';

  const app = createCosmoApp({
    getDb: () => adapter,
    getJwtSecret: () => jwtSecret,
  });

  const token = await createSessionToken(jwtSecret, 3600);

  console.log('--- Test 1: Markdown Batch Import ---');
  const mdPayload = {
    type: 'markdown',
    notes: [
      {
        title: '',
        content: '# 第一篇导入的笔记\n\n这是正文内容，包含公式 $E=mc^2$。',
      },
      {
        title: '自定义标题笔记',
        content: '这是没有H1开头的正文。',
      }
    ]
  };

  const res1 = await app.request('/api/notes/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(mdPayload)
  });

  const json1 = await res1.json();
  console.log('Markdown Import Result:', json1);
  if (json1.count !== 2) throw new Error('Markdown import count mismatch');

  const notesList1 = await adapter.query('SELECT title, content FROM notes');
  console.log('Imported Notes in DB:', notesList1);
  if (notesList1[0].title !== '第一篇导入的笔记') throw new Error('First note title mismatch');
  if (notesList1[1].title !== '自定义标题笔记') throw new Error('Second note title mismatch');

  console.log('--- Test 2: Full Backup JSON Restore (Overwrite mode) ---');
  const backupPayload = {
    type: 'backup',
    mode: 'overwrite',
    notes: [
      {
        id: 'note-001',
        title: '备份恢复笔记A',
        content: '# 备份A\n正文内容',
        icon: '🪐',
        parent_id: null,
      },
      {
        id: 'note-002',
        title: '备份恢复子笔记B',
        content: '# 备份B\n子正文内容',
        icon: '📄',
        parent_id: 'note-001',
      }
    ]
  };

  const res2 = await app.request('/api/notes/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(backupPayload)
  });

  const json2 = await res2.json();
  console.log('Backup Restore Result:', json2);
  if (json2.count !== 2) throw new Error('Backup restore count mismatch');

  const notesList2 = await adapter.query('SELECT id, parent_id, title, icon FROM notes');
  console.log('Notes after Overwrite Restore:', notesList2);
  if (notesList2.length !== 2) throw new Error('Notes length should be 2 after overwrite');
  if (notesList2[0].id !== 'note-001' || notesList2[1].parent_id !== 'note-001') {
    throw new Error('Hierarchy or IDs mismatch');
  }

  console.log('--- ALL IMPORT TESTS PASSED SUCCESSFULLY! ---');
}

runTest().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});

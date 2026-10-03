import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { DatabaseAdapter } from './adapter';

let instance: DatabaseAdapter | null = null;

export function getSqliteAdapter(dbPath?: string): DatabaseAdapter {
  if (instance) return instance;

  const targetPath = dbPath || process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'cosmo.db');
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(targetPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Initialize schema
  const schemaPath = path.resolve(process.cwd(), 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }

  instance = {
    async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
      const stmt = db.prepare(sql);
      return stmt.all(...params) as T[];
    },
    async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
      const stmt = db.prepare(sql);
      const row = stmt.get(...params);
      return (row as T) || null;
    },
    async execute(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number | bigint }> {
      const stmt = db.prepare(sql);
      const info = stmt.run(...params);
      return {
        changes: info.changes,
        lastInsertRowid: info.lastInsertRowid,
      };
    },
    async execScript(sql: string): Promise<void> {
      db.exec(sql);
    },
  };

  return instance;
}

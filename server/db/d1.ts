import { DatabaseAdapter } from './adapter';

export function getD1Adapter(d1: any): DatabaseAdapter {
  return {
    async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
      const stmt = d1.prepare(sql).bind(...params);
      const res = await stmt.all();
      return (res.results as T[]) || [];
    },
    async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
      const stmt = d1.prepare(sql).bind(...params);
      const res = await stmt.first();
      return (res as T) || null;
    },
    async execute(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number | bigint }> {
      const stmt = d1.prepare(sql).bind(...params);
      const res = await stmt.run();
      return {
        changes: res.meta?.changes || 0,
        lastInsertRowid: res.meta?.last_row_id,
      };
    },
    async execScript(sql: string): Promise<void> {
      await d1.exec(sql);
    },
  };
}

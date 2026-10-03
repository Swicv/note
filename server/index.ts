import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import fs from 'fs';
import { createCosmoApp } from './app';
import { getSqliteAdapter } from './db/sqlite';

const port = Number(process.env.PORT) || 3001;
const jwtSecret = process.env.JWT_SECRET || 'cosmo-super-secret-star-nexus-key';
const dbPath = process.env.DB_PATH;

const app = createCosmoApp({
  getDb: () => getSqliteAdapter(dbPath),
  getJwtSecret: () => jwtSecret,
});

// Serve frontend assets in production
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use('/*', serveStatic({ root: './dist' }));
  // SPA Fallback: for non-API routes, return index.html
  app.get('*', serveStatic({ path: './dist/index.html' }));
}

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
}, (info) => {
  console.log(`🌌 Cosmo Note server ignition ready on http://${info.address}:${info.port}`);
});

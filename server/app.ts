import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';
import { DatabaseAdapter } from './db/adapter';
import { authRouter } from './routes/auth';
import { notesRouter } from './routes/notes';
import { shareRouter, noteShareManagerRouter } from './routes/share';
import { settingsRouter } from './routes/settings';
import { authGuard } from './middleware/guard';

export interface CosmoAppOptions {
  getDb: (c: Context) => DatabaseAdapter;
  getJwtSecret: (c: Context) => string;
}

export function createCosmoApp(options: CosmoAppOptions) {
  const app = new Hono();

  // Inject db and secret at the very beginning of request pipeline
  app.use('*', async (c, next) => {
    c.set('db', options.getDb(c));
    c.set('jwtSecret', options.getJwtSecret(c));
    await next();
  });

  // CORS
  app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
  }));

  // Health check
  app.get('/api/health', (c) => c.json({ status: 'ok', time: Date.now() }));

  // Public Routes
  app.route('/api/auth', authRouter);
  app.route('/api/share', shareRouter);

  // Protected Routes (Guarded by SiYuan-style Master Access Code)
  const protectedApi = new Hono();
  protectedApi.use('*', authGuard);
  protectedApi.route('/notes', notesRouter);
  protectedApi.route('/notes', noteShareManagerRouter);
  protectedApi.route('/settings', settingsRouter);

  app.route('/api', protectedApi);

  return app;
}

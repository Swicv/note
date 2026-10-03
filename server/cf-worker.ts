import { createCosmoApp } from './app';
import { getD1Adapter } from './db/d1';

interface Env {
  DB: any;
  JWT_SECRET?: string;
  MASTER_PASSWORD?: string;
  ASSETS?: { fetch: typeof fetch };
}

const app = createCosmoApp({
  getDb: (c) => {
    const env = c.env as Env;
    if (!env?.DB) {
      throw new Error('Cloudflare D1 Database binding "DB" is missing in wrangler.toml');
    }
    return getD1Adapter(env.DB);
  },
  getJwtSecret: (c) => {
    const env = c.env as Env;
    return env?.JWT_SECRET || 'cosmo-cloudflare-edge-secret-nexus';
  },
});

export default {
  async fetch(request: Request, env: Env, ctx: any) {
    const url = new URL(request.url);

    // If API route or share API, handle with Hono
    if (url.pathname.startsWith('/api/')) {
      return app.fetch(request, env, ctx);
    }

    // Otherwise serve static assets via Cloudflare Pages ASSETS binding if available
    if (env.ASSETS) {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status !== 404) {
        return assetRes;
      }
      // SPA Fallback: serve index.html for client-side routing
      const indexReq = new Request(new URL('/', request.url), request);
      return env.ASSETS.fetch(indexReq);
    }

    return app.fetch(request, env, ctx);
  },
};

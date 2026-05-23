import { requireAuth } from './auth/requireAuth';
import { handleExpenses } from './routes/expenses';
import { handleTrips } from './routes/trips';
import type { Env } from './types';
import { errorResponse, json } from './utils/http';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const runtimeEnv = env as Record<string, string | undefined>;
    const isProduction = runtimeEnv.NODE_ENV === 'production' || runtimeEnv.ENVIRONMENT === 'production';
    if (!isProduction) {
      console.debug('[worker] request', { method: request.method, path: new URL(request.url).pathname });
      console.debug('[worker] env ready', {
        hasUrl: Boolean(env.SUPABASE_URL),
        hasKey: Boolean(env.SUPABASE_ANON_KEY),
        hasJwtSecret: Boolean(env.SUPABASE_JWT_SECRET),
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': 'content-type, authorization',
          'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        },
      });
    }

    const url = new URL(request.url);
    if (url.pathname === '/health') return json({ status: 'ok' });

    try {
      if (url.pathname.startsWith('/api/trips')) {
        if (!isProduction) console.debug('[api] route /api/trips');
        const auth = await requireAuth(request, env);
        return handleTrips(request, env, auth);
      }

      if (url.pathname.startsWith('/api/expenses')) {
        if (!isProduction) console.debug('[api] route /api/expenses');
        const auth = await requireAuth(request, env);
        return handleExpenses(request, env, auth);
      }

      return errorResponse('Not found', 404);
    } catch (err) {
      if (err instanceof Response) return err;
      const error = err instanceof Error ? err : new Error('Internal server error');
      console.error('[worker] unhandled error', {
        message: error.message,
        stack: error.stack,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack,
        }),
        {
          status: 500,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'content-type, authorization',
            'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          },
        },
      );
    }
  },
};

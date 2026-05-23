import { requireAuth } from './auth/requireAuth';
import { handleExpenses } from './routes/expenses';
import { handleTrips } from './routes/trips';
import type { Env } from './types';
import { errorResponse, json } from './utils/http';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
        const auth = await requireAuth(request, env);
        return handleTrips(request, env, auth);
      }

      if (url.pathname.startsWith('/api/expenses')) {
        const auth = await requireAuth(request, env);
        return handleExpenses(request, env, auth);
      }

      return errorResponse('Not found', 404);
    } catch (err) {
      if (err instanceof Response) return err;
      return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
    }
  },
};

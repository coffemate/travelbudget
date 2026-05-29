import { createUserSupabase } from '../lib/supabase';
import type { AuthContext, Env } from '../types';
import { errorResponse, json, parseJson } from '../utils/http';

export async function handleExpenses(request: Request, env: Env, auth: AuthContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/expenses', '') || '/';
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const isProduction = runtimeEnv.NODE_ENV === 'production' || runtimeEnv.ENVIRONMENT === 'production';
  if (!isProduction) {
    console.debug('[api] expenses request', {
      method: request.method,
      path,
      userId: auth.user.id,
      hasToken: Boolean(auth.token),
    });
  }

  const supabase = createUserSupabase(env, auth.token);

  try {
    const matched = path.match(/^\/([^/]+)$/);
    if (!matched) return errorResponse('Not found', 404);
    const expenseId = matched[1];

    if (request.method === 'PATCH') {
      const body = await parseJson<Record<string, unknown>>(request);
      const { data, error } = await supabase.from('expenses').update(body).eq('id', expenseId).select('*').maybeSingle();
      if (error) return errorResponse(error.message, 400);
      if (!data) return errorResponse('Expense not found', 404);
      return json(data);
    }

    if (request.method === 'DELETE') {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (error) return errorResponse(error.message, 400);
      return json({ success: true });
    }

    return errorResponse('Not found', 404);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Internal server error');
    console.error('[error] [worker] expenses route failed', {
      message: error.message,
      stack: error.stack,
      method: request.method,
      path,
      userId: auth.user.id,
    });
    return new Response(
      JSON.stringify({ success: false, error: error.message, stack: error.stack }),
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
}

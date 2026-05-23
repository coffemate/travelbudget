import { createUserSupabase } from '../lib/supabase';
import type { AuthContext, Env } from '../types';
import { errorResponse, json, parseJson } from '../utils/http';

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function handleTrips(request: Request, env: Env, auth: AuthContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/trips', '') || '/';
  const runtimeEnv = env as Record<string, string | undefined>;
  const isProduction = runtimeEnv.NODE_ENV === 'production' || runtimeEnv.ENVIRONMENT === 'production';
  if (!isProduction) {
    console.debug('[api] trips request', {
      method: request.method,
      path,
      userId: auth.user.id,
      hasToken: Boolean(auth.token),
    });
  }
  const supabase = createUserSupabase(env, auth.token);

  try {
    if (request.method === 'GET' && path === '/') {
      const { data, error } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
      if (error) return errorResponse(error.message, 400);
      return json(data ?? []);
    }

    if (request.method === 'POST' && path === '/') {
      const body = await parseJson<Record<string, unknown>>(request);
      const payload = { ...body, owner_id: auth.user.id };
      const { data, error } = await supabase.from('trips').insert(payload).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return json(data, 201);
    }

    const matched = path.match(/^\/([^/]+)(?:\/expenses)?$/);
    if (!matched) return errorResponse('Not found', 404);
    const tripId = matched[1];
    if (!isUuid(tripId)) return errorResponse('tripId must be a valid UUID', 400);

    if (request.method === 'GET' && path === `/${tripId}`) {
      const { data, error } = await supabase.from('trips').select('*').eq('id', tripId).maybeSingle();
      if (error) return errorResponse(error.message, 400);
      if (!data) return errorResponse('Trip not found', 404);
      return json(data);
    }

    if (request.method === 'PUT' && path === `/${tripId}`) {
      const body = await parseJson<Record<string, unknown>>(request);
      const { data, error } = await supabase.from('trips').update(body).eq('id', tripId).select('*').maybeSingle();
      if (error) return errorResponse(error.message, 400);
      if (!data) return errorResponse('Trip not found', 404);
      return json(data);
    }

    if (request.method === 'DELETE' && path === `/${tripId}`) {
      const { error } = await supabase.from('trips').delete().eq('id', tripId);
      if (error) return errorResponse(error.message, 400);
      return json({ success: true });
    }

    if (request.method === 'POST' && path === `/${tripId}/expenses`) {
      const body = await parseJson<Record<string, unknown>>(request);
      const payload = {
        ...body,
        trip_id: tripId,
        created_by: auth.user.id,
        paid_by: body.paid_by ?? auth.user.id,
      };
      const { data, error } = await supabase.from('expenses').insert(payload).select('*').single();
      if (error) return errorResponse(error.message, 400);
      return json(data, 201);
    }

    if (request.method === 'GET' && path === `/${tripId}/expenses`) {
      const { data, error } = await supabase.from('expenses').select('*').eq('trip_id', tripId).order('spent_at', { ascending: false });
      if (error) return errorResponse(error.message, 400);
      return json(data ?? []);
    }

    return errorResponse('Not found', 404);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Internal server error');
    console.error('[error] [worker] trips route failed', {
      message: error.message,
      stack: error.stack,
      method: request.method,
      path,
      userId: auth.user.id,
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
}

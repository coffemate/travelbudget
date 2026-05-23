import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createAnonSupabase } from '../lib/supabase';
import type { AuthContext, Env } from '../types';

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function unauthorizedResponse(message: string): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status: 401,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    },
  });
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

async function verifyJwtLocally(token: string, env: Env): Promise<Record<string, unknown> | null> {
  try {
    if (env.SUPABASE_JWT_SECRET) {
      const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      return payload;
    }

    if (!jwksCache) {
      jwksCache = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));
    }
    const { payload } = await jwtVerify(token, jwksCache);
    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request, env: Env): Promise<AuthContext> {
  const token = getBearerToken(request);
  if (!token) throw unauthorizedResponse('Unauthorized');

  const localPayload = await verifyJwtLocally(token, env);
  if (localPayload?.sub) {
    return {
      token,
      user: {
        id: String(localPayload.sub),
        email: typeof localPayload.email === 'string' ? localPayload.email : undefined,
      },
    };
  }

  const supabase = createAnonSupabase(env);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw unauthorizedResponse('Invalid or expired token');
  }

  return { token, user: { id: data.user.id, email: data.user.email } };
}

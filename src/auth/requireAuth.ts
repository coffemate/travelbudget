import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createAnonSupabase } from '../lib/supabase';
import type { AuthContext, Env } from '../types';

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

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
  if (!token) throw new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });

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
    throw new Response(JSON.stringify({ message: 'Invalid or expired token' }), { status: 401 });
  }

  return { token, user: { id: data.user.id, email: data.user.email } };
}

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

function authServiceResponse(message: string): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status: 503,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    },
  });
}

type DirectAuthResult = {
  status: number;
  user: { id: string; email?: string } | null;
  errorMessage?: string;
};

async function verifyWithAuthRest(token: string, env: Env): Promise<DirectAuthResult> {
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    console.error("[auth] upstream response body parsing failed", {
      status: response.status,
      contentType: response.headers.get("content-type"),
    });
    body = null;
  }
  const record = body && typeof body === 'object' ? body as Record<string, unknown> : null;
  const userRecord = record?.id ? record : null;
  return {
    status: response.status,
    user: userRecord
      ? { id: String(userRecord.id), email: typeof userRecord.email === 'string' ? userRecord.email : undefined }
      : null,
    errorMessage: typeof record?.message === 'string'
      ? record.message
      : typeof record?.error_description === 'string'
        ? record.error_description
        : undefined,
  };
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization') || '';
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
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const isProduction = runtimeEnv.NODE_ENV === 'production' || runtimeEnv.ENVIRONMENT === 'production';

  if (!isProduction) {
    console.debug('[auth] env ready', {
      hasUrl: Boolean(env.SUPABASE_URL),
      hasKey: Boolean(env.SUPABASE_ANON_KEY),
    });
  }

  const token = getBearerToken(request);
  if (!token) {
    console.warn('[warn] [auth] missing authorization header');
    throw unauthorizedResponse('Unauthorized');
  }

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
  if (!isProduction) {
    console.debug('[auth] getUser checked', {
      hasUser: Boolean(data?.user),
      hasError: Boolean(error),
      errorMessage: error?.message,
    });
  }

  let directResult: DirectAuthResult;
  try {
    directResult = await verifyWithAuthRest(token, env);
    if (!isProduction) console.debug('[auth] direct REST /auth/v1/user checked', {
      status: directResult.status,
      hasUser: Boolean(directResult.user),
      errorMessage: directResult.errorMessage,
    });
  } catch (directError) {
    const message = directError instanceof Error ? directError.message : 'Auth REST request failed';
    console.error('[auth] direct REST /auth/v1/user failed', { message });
    throw authServiceResponse('Supabase Auth service unavailable');
  }

  if (!error && data.user) {
    return { token, user: { id: data.user.id, email: data.user.email } };
  }

  if (directResult.status === 401 || directResult.status === 403) {
    console.warn('[warn] [auth] invalid or expired token', {
      sdkError: error?.message,
      directStatus: directResult.status,
    });
    throw unauthorizedResponse('Invalid or expired token');
  }

  if (directResult.status >= 500) {
    console.error('[auth] Supabase Auth service error', {
      sdkError: error?.message,
      directStatus: directResult.status,
      directError: directResult.errorMessage,
    });
    throw authServiceResponse('Supabase Auth service error');
  }

  if (directResult.user) {
    console.warn('[auth] supabase-js getUser failed but direct Auth REST succeeded', {
      sdkError: error?.message,
      directStatus: directResult.status,
    });
    return { token, user: directResult.user };
  }

  console.warn('[warn] [auth] invalid or unusable auth response', {
    sdkError: error?.message,
    directStatus: directResult.status,
  });
  throw unauthorizedResponse('Invalid or expired token');
}

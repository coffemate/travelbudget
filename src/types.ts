export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_JWT_SECRET?: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export interface AuthContext {
  token: string;
  user: AuthUser;
}

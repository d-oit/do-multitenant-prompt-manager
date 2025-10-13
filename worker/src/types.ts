export interface Env {
  DB: D1Database;
  PROMPT_CACHE: KVNamespace;
  API_TOKEN?: string;
  LOG_LEVEL?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  RATE_LIMIT_WINDOW_SECONDS?: string;
  JWT_SECRET?: string;
  REFRESH_TOKEN_SECRET?: string;
  ACCESS_TOKEN_TTL_SECONDS?: string;
  REFRESH_TOKEN_TTL_SECONDS?: string;
}

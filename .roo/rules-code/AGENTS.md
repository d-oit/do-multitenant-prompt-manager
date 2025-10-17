# Project Coding Rules (Non-Obvious Only)

## Authentication and Authorization
- Always use `ensureTenantAccess()` and `requirePermission()` from `worker/src/auth.ts` for tenant isolation
- CSRF protection is mandatory for mutating requests when using cookie-based sessions (not bearer tokens)
- Bearer tokens can be generated from authenticated sessions via `/auth/bearer-token` endpoint

## API Client Patterns
- API client in `frontend/src/lib/api.ts` has deprecated token parameters - prefer cookie-based sessions
- CSRF tokens must be read from `pm_csrf` cookie and sent as `x-csrf-token` header for mutating requests
- Bearer tokens are stored in localStorage as `pm_bearer_token` and take precedence over cookies

## Database Operations
- Always use tenant-aware queries with `tenant_id` filtering for data isolation
- FTS5 search requires proper trigger setup (`prompts_fts` virtual table)
- Soft deletion uses `archived` flag instead of physical deletes

## Caching Strategy
- Prompt lists cached with composite keys from `buildPromptCacheKey()` in `worker/src/lib/cache.ts`
- Cache invalidation required after updates via `invalidatePromptCaches()` and `clearListCache()`
- Background cache warming runs every 15 minutes via `warmCacheIfNeeded()`

## Error Handling
- Use `jsonResponse()` and `serializeError()` from `worker/src/lib/json.ts` for consistent error formatting
- Logger files (`worker/src/lib/logger.ts`, `frontend/src/lib/logger.ts`) are exempt from no-console ESLint rules

## Testing Patterns
- Worker tests require Cloudflare Workers test environment with mocked execution context
- Frontend tests need `jsdom` environment and specific setup file (`src/setupTests.ts`)
- E2E tests run with single worker (`workers: 1`) to avoid database conflicts

## Build Configuration
- Frontend uses manual chunk splitting for React, Monaco Editor, and charts
- Worker TypeScript config has `strict: false` while frontend has `strict: true`
- Shared package exports use dual `.js` and extensionless paths for compatibility
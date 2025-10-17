# Project Debug Rules (Non-Obvious Only)

## Worker Debugging
- Worker tests require `@cloudflare/vitest-pool-workers` environment with mocked execution context
- Database state persists locally via `--persist-to=.wrangler/state` flag during development
- E2E test mode enabled via `--var E2E_TEST_MODE:true` environment variable

## Frontend Debugging  
- Service worker unregistered in development to avoid caching issues (`unregisterServiceWorker()`)
- Monaco Editor requires specific chunk splitting configuration for proper loading
- CSS-in-JS patterns use design tokens from `frontend/src/design-system/tokens.css`

## Authentication Debugging
- CSRF validation fails silently if `pm_csrf` cookie and `x-csrf-token` header don't match
- Bearer tokens stored in localStorage take precedence over cookie sessions
- Rate limiting configured via environment variables (`RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`)

## Database Debugging
- FTS5 virtual table triggers must be properly set up for search functionality
- Tenant isolation enforced via foreign key constraints - missing tenants cause silent failures
- Soft deletion uses `archived` flag instead of physical deletes

## Cache Debugging
- Cache warming runs every 15 minutes via background task (`warmCacheIfNeeded`)
- Prompt cache keys built with composite tenant/sort/pagination parameters
- Cache invalidation required after updates - missing invalidation causes stale data

## Error Handling
- Unhandled rejections logged to console but not surfaced to users
- Logger files exempt from no-console ESLint rules for debugging purposes
- JSON responses use consistent error formatting via `serializeError()`
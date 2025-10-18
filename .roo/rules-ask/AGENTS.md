# Project Documentation Rules (Non-Obvious Only)

## Architecture Context

- Frontend and worker are separate packages in npm workspace monorepo
- Shared types imported via `@shared` alias pointing to `../shared` directory
- API versioning uses path-based patterns (`/v1/prompts`) with automatic header injection

## Authentication Flow

- Migration from bearer tokens to HttpOnly cookies in progress - token parameters deprecated
- CSRF protection required for state-changing requests when using cookies
- Bearer tokens can be generated from authenticated sessions for API usage

## Data Patterns

- Tenant isolation enforced at database level with foreign key constraints
- Search uses SQLite FTS5 virtual tables with automatic trigger maintenance
- Soft deletion via `archived` flag instead of physical record removal

## Testing Environment

- E2E tests run with single worker to avoid database conflicts (`workers: 1`)
- Frontend tests require `jsdom` environment with specific setup file
- Worker tests use Cloudflare Workers test environment with execution context mocking

## Build Configuration

- Frontend chunks manually split for React, Monaco Editor, and charts
- Worker TypeScript config has `strict: false` while frontend has `strict: true`
- Production builds strip console/debugger statements via terser compression

## Security Implementation

- CSP, HSTS, and CORP headers automatically added to responses
- CORS origin validation with environment-configurable allowed origins
- Rate limiting configurable via environment variables

# Project Architecture Rules (Non-Obvious Only)

## System Architecture
- Monorepo with frontend (React/Vite) and worker (Cloudflare Workers) packages
- Shared package provides types and design tokens via dual `.js`/extensionless exports
- API versioning uses path-based pattern with automatic header injection

## Authentication Strategy
- Migration from bearer tokens to HttpOnly cookie sessions in progress
- CSRF protection mandatory for mutating requests when using cookies
- Bearer tokens can be generated from authenticated sessions for API clients

## Data Architecture
- Multi-tenant isolation enforced at database level with foreign key constraints
- SQLite with FTS5 virtual tables for search functionality
- Soft deletion via `archived` flag instead of physical record removal

## Caching Strategy
- Prompt lists cached with composite keys including tenant, sort, pagination parameters
- Cache warming runs every 15 minutes via background task
- Individual prompt cache invalidated on updates

## Security Architecture
- CSP, HSTS, and CORP headers automatically added to responses
- CORS origin validation with environment-configurable allowed origins
- Rate limiting configurable via environment variables

## Deployment Architecture
- Frontend deploys to Cloudflare Pages with manual chunk splitting
- Worker deploys to Cloudflare Workers with local state persistence
- Production builds strip console/debugger statements

## Testing Architecture
- E2E tests use single worker to avoid database conflicts
- Frontend tests require `jsdom` environment with specific setup
- Worker tests use Cloudflare Workers test environment with execution context mocking
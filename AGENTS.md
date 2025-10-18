# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Critical Non-Obvious Patterns

### Monorepo Structure

- Worker package referenced as `do-multitenant-prompt-manager-worker` in root scripts (not `worker`)
- Shared package uses dual `.js`/extensionless exports for compatibility

### Authentication System

- Migration from bearer tokens to HttpOnly cookies in progress - API client has deprecated token parameters
- CSRF protection required for mutating requests when using cookies
- Bearer tokens generated from authenticated sessions via `/auth/bearer-token`

### Testing Specifics

- E2E tests use single worker (`workers: 1`) to avoid database conflicts
- Frontend tests require `jsdom` environment with `src/setupTests.ts`
- Worker tests use Cloudflare Workers test environment with execution context mocking

### Build Configuration

- Frontend chunks manually split for React, Monaco Editor, and charts
- Worker TypeScript config has `strict: false` while frontend has `strict: true`
- Production builds strip console/debugger statements via terser

### Database Patterns

- SQLite with FTS5 virtual tables for search (`prompts_fts`)
- Tenant isolation enforced at database level with foreign key constraints
- Soft deletion via `archived` flag instead of physical deletes

### Caching Strategy

- Prompt lists cached with composite keys (tenant/sort/pagination)
- Cache warming runs every 15 minutes via background task
- Cache invalidation required after updates

## Development Guidelines

- Maximum 500 LOC per file to maintain code readability and maintainability
- Atomic commits after successful task completion (one logical change per commit)

## 📝 Commit Message Convention

Follow **Conventional Commits**:

```
<type>(<scope>): <short description>
```

### Types:

- `feat` → new feature (minor version bump)
- `fix` → bug fix (patch version bump)
- `perf` → performance improvement
- `refactor` → code changes with no feature/bug impact
- `docs` → documentation only
- `test` → tests only
- `chore` → tooling, CI, or maintenance
- `BREAKING CHANGE:` (in body) → major version bump

### Examples:

```
feat(auth): add OAuth2 login
fix(api): handle null user id
refactor(ui): simplify header rendering
```

✅ **Rules**

- Use imperative mood: "add", not "added" or "adds"
- Keep first line ≤ 72 chars
- Scope is optional but encouraged
- Body can provide details, breaking changes, or context

### Version Impact:

- `fix:` → patch
- `feat:` → minor
- `BREAKING CHANGE:` → major

### Automation Hooks

- Validate commit messages using commitlint + Husky (already configured)
- Use squash merge with PR titles aligned to the convention.

# E2E Tests

End-to-end tests using Playwright with **real Cloudflare services** (D1 database and KV namespace).

## Setup

The e2e tests use actual Cloudflare D1 and KV services configured in `wrangler.toml`:

- D1 Database: `do_multitenant_prompt_manager`
- KV Namespace: `PROMPT_CACHE`

### Prerequisites

1. Install dependencies:

   ```bash
   npm install
   ```

2. Ensure Wrangler is configured and you have access to the Cloudflare services

3. Run database migrations:
   ```bash
   cd worker
   npm run migrate
   ```

## Running Tests

### Run all e2e tests:

```bash
npm run test:e2e
```

### Run tests in UI mode (interactive):

```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser):

```bash
npm run test:e2e:headed
```

### Run tests in debug mode:

```bash
npm run test:e2e:debug
```

## Test Architecture

- **No mocking**: Tests use real Cloudflare Worker API running locally
- **Real database**: Uses D1 database with actual data
- **Real KV**: Uses KV namespace for caching
- **Sequential execution**: Tests run sequentially to avoid database conflicts
- **Unique test IDs**: Each test generates unique identifiers to avoid conflicts

## Test Structure

- `fixtures.ts` - Test fixtures and setup
- `setup/dbHelpers.ts` - Database utilities for test data management
- `*.spec.ts` - Individual test suites

### New Mobile-First Test Suites

- `mobile-responsive.spec.ts` - Mobile-first responsive design tests
- `touch-interactions.spec.ts` - Touch gestures and mobile interactions
- `performance-mobile.spec.ts` - Core Web Vitals and mobile performance
- `modern-components.spec.ts` - Command palette, data table, skeleton loaders
- `accessibility-enhanced.spec.ts` - WCAG 2.1 AA compliance tests
- `test-runner-mobile.spec.ts` - Cross-device integration tests

## Configuration

- `playwright.config.ts` - Playwright configuration
  - Starts worker with `wrangler dev --local`
  - Starts frontend with `VITE_API_BASE_URL=http://localhost:8787`
  - Multiple browser projects: Desktop Chrome, Mobile Chrome, Mobile Safari, Tablet
- `.env.e2e` - Environment variables for e2e tests

### Device Testing

The test suite now includes multiple device configurations:

- **Desktop**: Chrome on 1200x800 viewport
- **Mobile Chrome**: Pixel 5 device simulation
- **Mobile Safari**: iPhone 12 device simulation
- **Tablet**: iPad Pro device simulation

### Mobile-Specific Test Commands

```bash
# Run only mobile tests
npm run test:e2e -- --grep "Mobile"

# Run only touch interaction tests
npm run test:e2e -- touch-interactions.spec.ts

# Run performance tests
npm run test:e2e -- performance-mobile.spec.ts

# Run accessibility tests
npm run test:e2e -- accessibility-enhanced.spec.ts

# Run cross-device integration tests
npm run test:e2e -- test-runner-mobile.spec.ts
```

## Notes

- Tests create real data in the local D1 database
- Database state persists in `.wrangler/state`
- Each test uses unique identifiers to avoid conflicts
- To reset database, delete `.wrangler/state` directory

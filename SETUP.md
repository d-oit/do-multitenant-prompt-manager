## Overview

This guide explains how to provision dependencies, configure environments, and run the DO Multi-Tenant Prompt Manager locally and in Cloudflare.

## Prerequisites

- **Node.js 20+** (Wrangler and Vite require modern Node; verify with `node --version`).
- **npm 10+** (shipped with recent Node releases).
- **Cloudflare account** with access to:
  - D1 database service.
  - KV namespaces.
- **Wrangler CLI** (`npm install -g wrangler` or use `npx wrangler`).
- (Optional for E2E) **Playwright browsers** (`npx playwright install`).

## Initial Repository Setup

1. Clone the repository and enter the project directory.
2. Install workspace dependencies:

   ```bash
   npm install
   ```

   Husky git hooks install automatically via the root `prepare` script.

3. **(Recommended)** Run the automated setup script:
   ```bash
   npm run setup
   ```
   This will create your `.env` file with secure secrets, and provision Cloudflare D1 database and KV namespace resources.

## Environment Configuration

### Cloudflare Resources Setup

Before configuring environments, create and configure your Cloudflare resources:

1. **Create D1 Database**:

   ```bash
   wrangler d1 create do_multitenant_prompt_manager
   ```

   This command will output a database ID. Note this ID for the next step.

2. **Create KV Namespace**:

   ```bash
   wrangler kv namespace create "PROMPT_CACHE"
   ```

   This command will output a namespace ID. Note this ID for the next step.

3. **Update `wrangler.toml`**:
   Replace the placeholder values in `wrangler.toml`:
   - Set `database_id` to the ID from step 1.
   - Set `id` under `[[kv_namespaces]]` to the ID from step 2.

### Root `.env`

1. Copy `.env.example` to `.env` in the project root:

   ```bash
   cp .env.example .env
   ```

2. Generate strong secrets for JWT tokens:
   - `JWT_SECRET`: Generate a cryptographically secure random string (at least 256 bits/32 bytes)
   - `REFRESH_TOKEN_SECRET`: Generate a separate cryptographically secure random string

   **Example using OpenSSL**:

   ```bash
   openssl rand -hex 32
   ```

   Run this twice and assign one output to each secret.

3. Adjust other values as needed (e.g., token TTLs, rate limits).

### Cloudflare Secrets and Bindings

Configure matching secrets in your Cloudflare worker environment:

```bash
wrangler secret put JWT_SECRET
wrangler secret put REFRESH_TOKEN_SECRET
```

When prompted, enter the same values you set in your root `.env` file.

**Note**: `JWT_SECRET` and `REFRESH_TOKEN_SECRET` are the only required secrets for this application.

### Frontend Build-Time Variables

Create `frontend/.env` (or `.env.local`) if you need overrides:

- `VITE_API_BASE_URL` should point to your worker endpoint (e.g., `http://localhost:8787` during local development).
- `VITE_LOG_LEVEL` controls client logging verbosity.

## Local Development

### Start the Worker API

```bash
npm run dev:worker
```

This runs `wrangler dev --local --persist-to=.wrangler/state`, exposing the worker on port 8787 with a local D1 database and KV storage persisted under `.wrangler/state`.

### Apply Database Migrations Locally

When the worker dev server is running (or via `wrangler login`), apply migrations:

```bash
npm run migrate --workspace do-multitenant-prompt-manager-worker
```

Wrangler targets the `do_multitenant_prompt_manager` D1 database defined in `wrangler.toml`.

### Start the Frontend

```bash
npm run dev:frontend
```

By default Vite serves the UI on `http://localhost:5173`. Ensure `VITE_API_BASE_URL` targets the worker endpoint.

## Code Quality and Testing

- **Lint**: `npm run lint`
- **Format check**: `npm run format`
- **Format fix**: `npm run format:fix`
- **Typecheck worker**: `npm run typecheck --workspace do-multitenant-prompt-manager-worker`
- **Unit tests**: `npm run test` (runs worker + frontend Vitest suites)
- **Worker-only tests**: `npm run test:worker`
- **Frontend-only tests**: `npm run test:frontend`
- **End-to-end tests**: `npm run test:e2e` (requires `playwright.config.ts` prerequisites and browsers installed)

## Deployment

1. Ensure Cloudflare bindings and secrets are configured as described above.
2. Deploy the worker API:
   ```bash
   npm run deploy:worker
   ```
3. Deploy the Pages frontend (uses `scripts/deploy-pages.mjs`):
   ```bash
   npm run deploy:pages
   ```

## Troubleshooting Tips

- **Wrangler authentication**: run `wrangler login` if commands report missing credentials.
- **Local D1 resets**: delete `.wrangler/state` to reset the persisted local database.
- **Playwright dependencies**: `npx playwright install --with-deps` may be required on CI or fresh machines.

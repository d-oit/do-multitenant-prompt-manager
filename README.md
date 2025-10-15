# do-multitenant-prompt-manager

A multi-tenant prompt operations suite that consolidates dashboarding, analytics, and prompt authoring into one workspace, featuring tenant management, keyboard-driven workflows, and token-gated Cloudflare worker APIs to orchestrate prompt lifecycles end-to-end.

## Overview

This project provides a comprehensive solution for managing prompts across multiple tenants with the following key features:

- **Multi-tenant architecture**: Isolated workspaces for different organizations
- **Unified dashboard**: Consolidated view of analytics, metrics, and prompt performance
- **Advanced prompt authoring**: Monaco-based editor with syntax highlighting and validation
- **Keyboard-driven workflows**: Efficient navigation and operations via keyboard shortcuts
- **Cloudflare Worker APIs**: Serverless backend with token-based authentication
- **End-to-end prompt lifecycle**: From creation to deployment and monitoring

## Architecture

This is a monorepo containing:

- **frontend**: React-based web application built with Vite
- **worker**: Cloudflare Worker API for backend services
- **shared**: Shared types and utilities (if applicable)

## Getting Started

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for worker deployment)

### Installation

```bash
npm install
```

### Development

Run both frontend and worker in development mode:

```bash
# Frontend
npm run dev:frontend

# Worker
npm run dev:worker
```

### Testing

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:frontend

# Run worker tests
npm run test:worker

# Run E2E tests
npm run test:e2e
```

### Deployment

```bash
# Deploy worker
npm run deploy:worker

# Deploy frontend (Cloudflare Pages)
npm run deploy:pages
```

## Scripts

- `npm run dev:frontend` - Start frontend development server
- `npm run dev:worker` - Start worker development server
- `npm run build:frontend` - Build frontend for production
- `npm run lint` - Lint all workspaces
- `npm run format` - Check code formatting
- `npm run test` - Run all tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run deploy:worker` - Deploy worker to Cloudflare
- `npm run deploy:pages` - Deploy frontend to Cloudflare Pages

## License

See [LICENSE](./LICENSE) for details.

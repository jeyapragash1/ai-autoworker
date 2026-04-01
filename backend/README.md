# AI AutoWorker Backend

Express + TypeScript backend for AI AutoWorker.

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.example .env
```

3. Create database schema

```bash
psql "$DATABASE_URL" -f migrations/001_init.sql
psql "$DATABASE_URL" -f migrations/002_task_lifecycle.sql
```

4. Run development server

```bash
npm run dev
```

## API

- POST /api/task
  - body: { "input": "Create a REST API using Node.js" }
- GET /api/task/:id
- POST /api/task/:id/retry
- GET /api/tasks
- GET /api/metrics
- GET /health
- GET /readyz

## Operational Features

- Request ID header (`X-Request-Id`) on every response
- Structured JSON request logs
- Basic in-memory API rate limiter
- Readiness probe (`/readyz`) with database connectivity check

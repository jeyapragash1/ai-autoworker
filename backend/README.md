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
```

4. Run development server

```bash
npm run dev
```

## API

- POST /api/task
  - body: { "input": "Create a REST API using Node.js" }
- GET /api/task/:id
- GET /api/tasks
- GET /health

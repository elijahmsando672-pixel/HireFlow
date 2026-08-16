# HireFlow

HireFlow is a full-stack recruitment and freelancing platform. It provides job posts and proposals, service gigs, contracts, mock escrow payments, reviews, direct messages, saved items, user profiles, and external job aggregation.

## Stack

- React 19, TypeScript, Vite, React Router, Tailwind CSS
- Express and SQLite (`better-sqlite3`)
- bcrypt authentication with JWT Bearer tokens
- Zod validation, Helmet, rate limiting, and CORS allow-listing
- node-cron job aggregation with pluggable source adapters

## Project structure

```
web/                    React application
server/app.js           Express middleware, API routes, and static hosting
server/index.js         Process startup and aggregation scheduler
server/routes/          Marketplace, aggregation, and admin endpoints
server/aggregation/     Sources, normalization, deduplication, and sync jobs
data/                   Local SQLite database files (ignored by Git)
tests/                  Vitest unit and API tests
```

The root HTML/CSS/JavaScript files are retained from the legacy static implementation. The active marketplace client is in `web/`.

## Run locally

Prerequisite: Node.js 18+.

Start the API:

```bash
npm install
npm run dev
```

Start the React client in another terminal:

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to Express at `http://localhost:3000`.

To serve a production client build from Express:

```bash
cd web
npm run build
cd ..
npm start
```

## Configuration

Copy `.env.example` to `.env` and set the values required for your environment.

```dotenv
PORT=3000
NODE_ENV=development
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@example.com
AGGREGATION_ENABLED=true
RUN_SYNC_ON_START=false
JOB_SYNC_INTERVAL_MINUTES=30
MOCK_SOURCE_ENABLED=true
```

`JWT_SECRET` is mandatory in production. `CORS_ORIGIN` is optional and accepts a comma-separated allow-list of frontend origins.

## Job aggregation

The aggregation pipeline imports listings only from authorized sources, normalizes them, deduplicates them, and records source/sync status in SQLite.

- Public API: `/api/aggregated-jobs`
- Admin API: `/api/admin`
- Manual sync: `npm run sync:jobs`

The admin API requires an authenticated administrator (`role = 'admin'` in the database or a matching `ADMIN_EMAIL`).

## Quality checks

```bash
npm test

cd web
npm run typecheck
```

## Security and workflow rules

- Server-side authorization protects private records and state transitions.
- Contracts control payment, delivery, completion, and cancellation; orders are not directly state-editable.
- Monetary values and proposal timelines must be positive.
- Multi-record lifecycle actions run inside SQLite transactions.
- API requests are size-limited and rate-limited; authentication allows 10 attempts per 15 minutes.

For architecture, endpoint details, and contributor guidance, see [DOCUMENTATION.md](DOCUMENTATION.md).

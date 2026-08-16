# HireFlow

HireFlow is a full-stack recruitment and freelancing platform. It supports job postings and proposals, service gigs and orders, contracts, mock escrow payments, reviews, direct messages, profiles, and an aggregated external-job catalogue.

## Architecture

```
React + Vite client (web/)
        |
        | same-origin /api requests, Bearer JWT
        v
Express application (server/app.js)
        |
        +-- Route modules and authorization
        +-- SQLite database and seed data
        +-- Job aggregation scheduler and admin API
```

Express serves `web/dist` when a production build exists. In development, Vite runs on port `5173` and proxies `/api` to Express on port `3000`.

## Technology

| Area | Technology |
| --- | --- |
| Client | React 19, TypeScript, React Router, Vite, Tailwind CSS |
| API | Express 4 |
| Database | SQLite through `better-sqlite3` |
| Authentication | bcrypt password hashes and 7-day JWTs |
| Validation | Zod |
| Security | Helmet, rate limiting, request-size limits, parameterized queries |
| Aggregation | node-cron plus configurable source adapters |

## Repository layout

```
.
├── web/                    # React client
│   ├── src/components/      # Shared UI components
│   ├── src/context/         # Authentication context
│   ├── src/lib/             # API client, types, formatting helpers
│   └── src/pages/           # Route-level React pages
├── server/
│   ├── app.js               # Express middleware, routes, static hosting
│   ├── index.js             # HTTP server and aggregation scheduler startup
│   ├── db.js                # Schema, migrations, seed data, database guards
│   ├── middleware.js        # JWT and administrator authorization
│   ├── routes/              # API route handlers
│   └── aggregation/         # Sources, normalization, deduplication, scheduler
├── data/                    # Runtime SQLite database files; not committed
├── css/, js/, *.html        # Legacy vanilla-HTML implementation
└── package.json             # API/server scripts and dependencies
```

The root HTML, CSS, and JavaScript files are the original static UI. The active product interface is the React application in `web/`.

## Application flows

### Authentication and profiles

1. A user registers or logs in at `/register` or `/login`.
2. The API returns a JWT and serialized user record.
3. `AuthContext` stores them in local storage and refreshes the profile through `GET /api/auth/me`.
4. Protected routes redirect unauthenticated visitors to `/login`.
5. Profile data is updated through `PUT /api/auth/profile`.

Roles are `client`, `freelancer`, or `both`. Administrative access is separate: it requires a database `admin` role or the configured `ADMIN_EMAIL`; ordinary registration cannot grant it.

### Jobs and proposals

- Clients create jobs and view proposals for their own postings.
- Freelancers submit one proposal per job.
- A job owner may reject a pending proposal.
- Hiring happens only through `POST /api/contracts`. It atomically creates a job contract, accepts the chosen proposal, and rejects remaining pending proposals for that job.

### Gigs, orders, and contracts

- A freelancer creates a gig with one or more priced packages.
- A different user orders a package, atomically creating the order and its linked contract.
- The contract is the source of truth for lifecycle changes:

```
Active -> Paid -> Delivered -> Completed
   \------------------> Cancelled
```

- Only the client can pay or complete a contract.
- Only the freelancer can deliver.
- Either party can cancel an eligible contract.
- Completing or cancelling a gig contract updates its linked order in the same transaction.
- Reviews are allowed only on completed gig orders, once per participant.

Payment records currently model an escrow workflow; no live payment provider is integrated.

### Job aggregation

The aggregation subsystem collects external listings from registered source adapters, normalizes and deduplicates them, then stores them in `aggregated_jobs`. It includes mock/API and example RSS source definitions by default.

Public endpoints are under `/api/aggregated-jobs`. Administrator endpoints under `/api/admin` expose source configuration, sync execution, status, and logs.

## API overview

| Prefix | Main purpose |
| --- | --- |
| `/api/auth` | Registration, login, current user, profile update |
| `/api/users` | Public profile lookup |
| `/api/jobs` | Browse, create, own jobs, proposal lists |
| `/api/applications` | Job application creation and current-user list |
| `/api/proposals` | Create, list, and reject proposals |
| `/api/gigs` | Browse, create, own gigs, gig details and reviews |
| `/api/orders` | Create an order and list buyer/seller orders |
| `/api/contracts` | Hire, list, view, pay, deliver, complete, cancel |
| `/api/reviews` | Create a review for a completed order |
| `/api/messages` | Conversations and direct-message threads |
| `/api/saved` | Saved jobs and gigs |
| `/api/aggregated-jobs` | Public aggregated-job search and metadata |
| `/api/admin` | Protected aggregation monitoring and controls |

Authenticated requests use:

```http
Authorization: Bearer <jwt>
```

The client centralizes these calls in `web/src/lib/api.ts`.

## Data model

Core SQLite entities:

- `users`
- `jobs`, `applications`, `proposals`
- `gigs`, `orders`, `reviews`
- `contracts`, `payments`
- `messages`
- `saved_jobs`, `saved_gigs`
- `aggregated_jobs`, `aggregation_sources`, `aggregation_sync_logs`

Foreign keys are enabled. Uniqueness constraints prevent repeated applications, proposals, saved records, and reviews. Positive monetary values and proposal timelines are enforced by SQLite checks on new databases and triggers on existing databases.

## Security model

- Passwords use bcrypt hashes.
- JWTs are verified only as HS256 tokens and expire after seven days.
- `JWT_SECRET` is mandatory when `NODE_ENV=production`; configure a unique value outside source control.
- API and authentication routes are rate-limited. Authentication permits 10 attempts per 15 minutes per client.
- Helmet sets security headers and Express disables `X-Powered-By`.
- JSON request bodies are capped at 100 KB.
- Cross-origin access is disabled unless `CORS_ORIGIN` explicitly lists allowed origins.
- Route handlers authorize ownership or participation before changing private records.
- Financial and lifecycle operations use SQLite transactions to prevent partial writes.

## Configuration

Create a local `.env` file as needed:

```dotenv
PORT=3000
NODE_ENV=development
JWT_SECRET=replace-with-a-long-random-development-secret
ADMIN_EMAIL=admin@example.com
AGGREGATION_ENABLED=true
RUN_SYNC_ON_START=false
JOB_SYNC_INTERVAL_MINUTES=30
MOCK_SOURCE_ENABLED=true
MOCK_SOURCE_FAIL_RATE=0
# Optional; separate browser origins with commas.
CORS_ORIGIN=http://localhost:5173
```

For production, `JWT_SECRET` is required. Do not commit `.env` or the `data/` directory.

## Running locally

Prerequisite: Node.js 18+.

Start the API:

```bash
npm install
npm run dev
```

In a second terminal, start the React client:

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173`.

To serve a production build through Express:

```bash
cd web
npm run build
cd ..
npm start
```

Open `http://localhost:3000`.

## Quality checks

Run the React typecheck:

```bash
cd web
npm run typecheck
```

The root package defines `npm test` for Vitest. Add files matching `*.test.*` or `*.spec.*` before using it in CI.

## Contributor notes

- `server/app.js` composes the API; `server/index.js` starts the process.
- Keep authorization on the server; client-side guards are only a user-experience feature.
- Add lifecycle operations through contract routes, not direct order-status updates.
- Use parameterized queries and explicit validation for new request data.
- Wrap multi-table writes in `db.transaction()`.
- Update this document when API routes, configuration, or security behavior changes.

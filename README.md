# HireFlow

HireFlow is a job recruitment and talent management platform built with vanilla HTML, CSS, JavaScript and Node.js/Express.

## Features

- User authentication (register, login, forgot password)
- Job posting and applications
- Gig marketplace
- Proposals and contracts
- Messaging
- Reviews
- Saved jobs/gigs
- **Job aggregation from external authorized sources**

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
PORT=3000
JWT_SECRET=your-secret-here
AGGREGATION_ENABLED=true
JOB_SYNC_INTERVAL_MINUTES=30
MOCK_SOURCE_ENABLED=true
```

## Job Aggregation System

HireFlow includes a modular job aggregation subsystem that collects job listings from authorized external sources.

### Architecture

```
server/aggregation/
├── aggregator.js        # Pipeline orchestrator
├── normalizer.js        # Canonical job shape
├── deduplicator.js      # 3-level dedup
├── scheduler.js         # Cron-based sync
├── sourceAdapter.js     # Adapter contract
├── sourceConfig.js      # Source registry
├── constants.js         # Canonical enums
├── logger.js            # Safe logging
├── cli.js               # Manual sync trigger
└── sources/
    ├── mockApiSource.js       # Dev/test source (enabled)
    └── exampleRssSource.js    # RSS template (disabled)
```

### Database Tables

- `aggregated_jobs` — collected job listings
- `aggregation_sources` — source registry and stats
- `aggregation_sync_logs` — sync history

### API Endpoints

**Public:**
- `GET /api/aggregated-jobs` — list with pagination, search, filters
- `GET /api/aggregated-jobs/:id` — single job
- `GET /api/aggregated-jobs/search` — search alias
- `GET /api/aggregated-jobs/featured` — top by budget
- `GET /api/aggregated-jobs/recent` — newest listings
- `GET /api/aggregated-jobs/categories` — category counts
- `GET /api/aggregated-jobs/skills` — skill counts
- `GET /api/aggregated-jobs/sources` — source status

**Admin (requires auth + admin role):**
- `GET /api/admin/aggregation/stats`
- `GET /api/admin/aggregation/sources`
- `PUT /api/admin/aggregation/sources/:name`
- `POST /api/admin/aggregation/sync`
- `GET /api/admin/aggregation/sync/status`
- `GET /api/admin/aggregation/sync/logs`

### Frontend

- `aggregated-jobs.html` — browse external jobs
- `aggregated-job-details.html` — view external job details with source attribution

### Adding a New Source

1. Create `server/aggregation/sources/yourSource.js`
2. Export a `createSourceAdapter({...})` with `name`, `label`, `type`, `enabled`, `fetchJobs`
3. Register in `server/aggregation/sourceConfig.js`
4. Configure any env vars
5. Enable via admin API or set `enabled: true`

### Manual Sync

```bash
npm run sync:jobs
```

### Running Tests

```bash
npm test
```

## Legal Note

Only collect jobs from sources where automated collection is explicitly permitted (official APIs, public RSS feeds with permissive terms, or sites whose robots.txt and terms of service allow it).

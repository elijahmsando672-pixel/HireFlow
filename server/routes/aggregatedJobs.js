const express = require("express");
const { z } = require("zod");
const db = require("../db");

function safeJsonParse(str, fallback) {
    try { return JSON.parse(str); } catch { return fallback; }
}

const router = express.Router();

const SORT_COLUMNS = {
    newest: "posted_at DESC",
    oldest: "posted_at ASC",
    budget_asc: "budget_min ASC",
    budget_desc: "budget_max DESC"
};

const ListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(200).optional(),
    category: z.string().trim().max(100).optional(),
    job_type: z.string().trim().max(50).optional(),
    experience_level: z.string().trim().max(50).optional(),
    source: z.string().trim().max(100).optional(),
    payment_type: z.string().trim().max(20).optional(),
    currency: z.string().trim().max(10).optional(),
    location: z.string().trim().max(100).optional(),
    remote: z.enum(["true", "false"]).optional(),
    min_budget: z.coerce.number().nonnegative().optional(),
    max_budget: z.coerce.number().nonnegative().optional(),
    sort: z.enum(["newest", "oldest", "budget_asc", "budget_desc"]).default("newest"),
    status: z.enum(["ACTIVE", "EXPIRED", "CLOSED", "REMOVED"]).default("ACTIVE")
});

function serializeJob(row) {
    return {
        id: row.id,
        externalId: row.external_id,
        source: row.source,
        sourceUrl: row.source_url,
        title: row.title,
        description: row.description,
        companyName: row.company_name,
        companyUrl: row.company_url,
        category: row.category,
        skills: row.skills ? safeJsonParse(row.skills, []) : [],
        budgetMin: row.budget_min,
        budgetMax: row.budget_max,
        currency: row.currency,
        paymentType: row.payment_type,
        jobType: row.job_type,
        experienceLevel: row.experience_level,
        location: row.location,
        remote: Boolean(row.remote),
        postedAt: row.posted_at,
        deadline: row.deadline,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function ok(res, data, pagination) {
    if (pagination) {
        return res.json({ success: true, data, pagination });
    }
    return res.json({ success: true, data });
}

function fail(res, status, code, message) {
    return res.status(status).json({ success: false, error: { code, message } });
}

function buildListQuery(query) {
    const where = [];
    const params = [];

    where.push("aj.status = ?");
    params.push(query.status || "ACTIVE");

    if (query.search) {
        where.push("(aj.title LIKE ? OR aj.company_name LIKE ? OR aj.description LIKE ? OR aj.skills LIKE ?)");
        const like = "%" + query.search + "%";
        params.push(like, like, like, like);
    }
    if (query.category) {
        where.push("aj.category = ?");
        params.push(query.category);
    }
    if (query.job_type) {
        where.push("aj.job_type = ?");
        params.push(query.job_type);
    }
    if (query.experience_level) {
        where.push("aj.experience_level = ?");
        params.push(query.experience_level);
    }
    if (query.source) {
        where.push("aj.source = ?");
        params.push(query.source);
    }
    if (query.payment_type) {
        where.push("aj.payment_type = ?");
        params.push(query.payment_type);
    }
    if (query.currency) {
        where.push("aj.currency = ?");
        params.push(query.currency);
    }
    if (query.location) {
        where.push("aj.location LIKE ?");
        params.push("%" + query.location + "%");
    }
    if (query.remote !== undefined) {
        where.push("aj.remote = ?");
        params.push(query.remote === "true" ? 1 : 0);
    }
    if (query.min_budget !== undefined) {
        where.push("aj.budget_max >= ?");
        params.push(query.min_budget);
    }
    if (query.max_budget !== undefined) {
        where.push("aj.budget_min <= ?");
        params.push(query.max_budget);
    }

    return { where, params };
}

function handleList(req, res) {
    const parsed = ListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return fail(res, 400, "VALIDATION_ERROR", parsed.error.issues[0].message);
    }
    const query = parsed.data;

    const { where, params } = buildListQuery(query);
    const whereSql = "WHERE " + where.join(" AND ");

    const total = db.prepare(`SELECT COUNT(*) AS n FROM aggregated_jobs aj ${whereSql}`).get(...params).n;
    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    const page = Math.min(query.page, totalPages);

    const order = SORT_COLUMNS[query.sort];
    const offset = (page - 1) * query.limit;

    const rows = db.prepare(`
        SELECT * FROM aggregated_jobs aj
        ${whereSql}
        ORDER BY ${order}
        LIMIT ? OFFSET ?
    `).all(...params, query.limit, offset);

    ok(res, rows.map(serializeJob), {
        page,
        limit: query.limit,
        total,
        totalPages
    });
}

router.get("/", handleList);

// Alias endpoint: same engine, distinct route for search-focused clients.
router.get("/search", handleList);

router.get("/featured", (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const rows = db.prepare(`
        SELECT * FROM aggregated_jobs
        WHERE status = 'ACTIVE' AND budget_min IS NOT NULL
        ORDER BY budget_max DESC
        LIMIT ?
    `).all(limit);
    ok(res, rows.map(serializeJob));
});

router.get("/recent", (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const rows = db.prepare(`
        SELECT * FROM aggregated_jobs
        WHERE status = 'ACTIVE'
        ORDER BY posted_at DESC
        LIMIT ?
    `).all(limit);
    ok(res, rows.map(serializeJob));
});

router.get("/categories", (req, res) => {
    const rows = db.prepare(`
        SELECT category, COUNT(*) AS count
        FROM aggregated_jobs
        WHERE status = 'ACTIVE' AND category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
    `).all();
    ok(res, rows.map((row) => ({ name: row.category, count: row.count })));
});

router.get("/skills", (req, res) => {
    const rows = db.prepare(`
        SELECT skills FROM aggregated_jobs
        WHERE status = 'ACTIVE' AND skills IS NOT NULL AND skills != '[]'
    `).all();

    const counts = new Map();
    for (const row of rows) {
        for (const skill of safeJsonParse(row.skills, [])) {
            counts.set(skill, (counts.get(skill) || 0) + 1);
        }
    }
    const sorted = [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    ok(res, sorted);
});

router.get("/sources", (req, res) => {
    const { getSources } = require("../aggregation/sourceConfig");
    const adapters = new Map(getSources().map((source) => [source.name, source]));
    const rows = db.prepare(`
        SELECT name, type, enabled, sync_interval_minutes,
               last_sync, last_success, status, error_count, error_message,
               fetched, inserted, updated, duplicates, rejected
        FROM aggregation_sources
        ORDER BY name
    `).all();
    ok(res, rows.map((row) => {
        const adapter = adapters.get(row.name);
        return {
            name: row.name,
            label: adapter ? adapter.label : row.name,
            description: adapter ? adapter.description : null,
            type: row.type,
            enabled: Boolean(row.enabled),
            syncIntervalMinutes: row.sync_interval_minutes,
            lastSync: row.last_sync,
            lastSuccess: row.last_success,
            status: row.status,
            errorCount: row.error_count,
            errorMessage: row.error_message,
            fetched: row.fetched,
            inserted: row.inserted,
            updated: row.updated,
            duplicates: row.duplicates,
            rejected: row.rejected
        };
    }));
});

router.get("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) {
        return fail(res, 404, "NOT_FOUND", "Job not found.");
    }
    const row = db.prepare("SELECT * FROM aggregated_jobs WHERE id = ?").get(id);
    if (!row) {
        return fail(res, 404, "NOT_FOUND", "Job not found.");
    }
    ok(res, serializeJob(row));
});

module.exports = router;

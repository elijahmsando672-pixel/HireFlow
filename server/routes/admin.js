const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { requireAdmin } = require("../middleware");
const { syncSource, syncAllSources, initializeSourceRecords } = require("../aggregation/aggregator");

const router = express.Router();

router.use(requireAdmin);

function fail(res, status, code, message) {
    return res.status(status).json({ success: false, error: { code, message } });
}

router.get("/jobs/stats", (req, res) => {
    const byStatus = db.prepare(`
        SELECT status, COUNT(*) AS n FROM aggregated_jobs GROUP BY status
    `).all();
    const total = byStatus.reduce((sum, row) => sum + row.n, 0);

    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const collectedToday = db.prepare(
        "SELECT COUNT(*) AS n FROM aggregated_jobs WHERE created_at >= ?"
    ).get(today + " 00:00:00").n;

    const collectedThisWeek = db.prepare(
        "SELECT COUNT(*) AS n FROM aggregated_jobs WHERE created_at >= ?"
    ).get(weekAgo).n;

    const bySource = db.prepare(`
        SELECT source, COUNT(*) AS n FROM aggregated_jobs GROUP BY source ORDER BY n DESC
    `).all();

    const statusMap = {};
    byStatus.forEach((row) => { statusMap[row.status] = row.n; });

    const lastSync = db.prepare(`
        SELECT source, MAX(finished_at) AS finished_at
        FROM aggregation_sync_logs WHERE status = 'SUCCESS'
        GROUP BY source ORDER BY finished_at DESC LIMIT 1
    `).get();

    res.json({
        success: true,
        data: {
            total,
            active: statusMap.ACTIVE || 0,
            expired: statusMap.EXPIRED || 0,
            closed: statusMap.CLOSED || 0,
            removed: statusMap.REMOVED || 0,
            collectedToday,
            collectedThisWeek,
            bySource,
            lastSuccessfulSync: lastSync || null
        }
    });
});

router.get("/sources", (req, res) => {
    const rows = db.prepare(`
        SELECT id, name, type, enabled, sync_interval_minutes,
               last_sync, last_success, status, error_count, error_message,
               fetched, inserted, updated, duplicates, rejected, created_at
        FROM aggregation_sources ORDER BY name
    `).all();
    res.json({
        success: true,
        data: rows.map((row) => ({ ...row, enabled: Boolean(row.enabled) }))
    });
});

const UpdateSourceSchema = z.object({
    enabled: z.boolean().optional(),
    sync_interval_minutes: z.number().int().min(1).max(1440).optional()
}).refine((value) => value.enabled !== undefined || value.sync_interval_minutes !== undefined, {
    message: "Provide at least one field to update."
});

router.put("/sources/:name", (req, res) => {
    const name = String(req.params.name || "");
    const parsed = UpdateSourceSchema.safeParse(req.body);
    if (!parsed.success) {
        return fail(res, 400, "VALIDATION_ERROR", parsed.error.issues[0].message);
    }

    const existing = db.prepare("SELECT * FROM aggregation_sources WHERE name = ?").get(name);
    if (!existing) {
        return fail(res, 404, "NOT_FOUND", "Unknown source.");
    }

    const { enabled, sync_interval_minutes } = parsed.data;
    if (enabled !== undefined) {
        db.prepare("UPDATE aggregation_sources SET enabled = ? WHERE name = ?").run(enabled ? 1 : 0, name);
    }
    if (sync_interval_minutes !== undefined) {
        db.prepare("UPDATE aggregation_sources SET sync_interval_minutes = ? WHERE name = ?").run(sync_interval_minutes, name);
    }

    const updated = db.prepare("SELECT * FROM aggregation_sources WHERE name = ?").get(name);
    res.json({ success: true, data: { ...updated, enabled: Boolean(updated.enabled) } });
});

const SyncRequestSchema = z.object({
    source: z.string().trim().min(1).optional()
});

router.post("/sync", async (req, res) => {
    const parsed = SyncRequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
        return fail(res, 400, "VALIDATION_ERROR", parsed.error.issues[0].message);
    }

    initializeSourceRecords();

    try {
        if (parsed.data.source) {
            const result = await syncSource(parsed.data.source);
            return res.json({ success: true, data: result });
        }
        const results = await syncAllSources();
        return res.json({ success: true, data: results });
    } catch (error) {
        return fail(res, 500, "SYNC_ERROR", error.message);
    }
});

router.get("/sync/status", (req, res) => {
    const rows = db.prepare(`
        SELECT id, source, started_at, finished_at, duration_ms, status,
               fetched, inserted, updated, duplicates, rejected, error
        FROM aggregation_sync_logs
        ORDER BY id DESC LIMIT 50
    `).all();
    res.json({ success: true, data: rows });
});

router.get("/sync/logs", (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const rows = db.prepare(`
        SELECT id, source, started_at, finished_at, duration_ms, status,
               fetched, inserted, updated, duplicates, rejected, error
        FROM aggregation_sync_logs
        ORDER BY id DESC LIMIT ?
    `).all(limit);
    res.json({ success: true, data: rows });
});

module.exports = router;

const db = require("../db");
const { normalizeRawJob } = require("./normalizer");
const { upsertJob } = require("./deduplicator");
const { getSources, getSource } = require("./sourceConfig");
const { SOURCE_STATUS } = require("./constants");
const logger = require("./logger");

// ---------------- source registry records ----------------

const UPSERT_SOURCE_RECORD = db.prepare(`
    INSERT INTO aggregation_sources (name, type, enabled, sync_interval_minutes)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
        type = excluded.type,
        sync_interval_minutes = CASE
            WHEN excluded.sync_interval_minutes IS NOT NULL THEN excluded.sync_interval_minutes
            ELSE aggregation_sources.sync_interval_minutes
        END
`);

const GET_SOURCE_RECORD = db.prepare("SELECT * FROM aggregation_sources WHERE name = ?");

const MARK_RUNNING = db.prepare(`
    UPDATE aggregation_sources
    SET status = ?, last_sync = datetime('now')
    WHERE name = ?
`);

const MARK_OK = db.prepare(`
    UPDATE aggregation_sources SET
        status = ?, last_success = datetime('now'),
        error_count = 0, error_message = NULL,
        fetched = ?, inserted = ?, updated = ?, duplicates = ?, rejected = ?
    WHERE name = ?
`);

const MARK_ERROR = db.prepare(`
    UPDATE aggregation_sources SET
        status = ?, error_message = ?, error_count = error_count + 1,
        fetched = ?, inserted = ?, updated = ?, duplicates = ?, rejected = ?
    WHERE name = ?
`);

const INSERT_SYNC_LOG = db.prepare(`
    INSERT INTO aggregation_sync_logs (
        source, started_at, finished_at, duration_ms, status,
        fetched, inserted, updated, duplicates, rejected, error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const LIST_ACTIVE_BY_SOURCE = db.prepare(`
    SELECT external_id FROM aggregated_jobs WHERE source = ? AND status = 'ACTIVE'
`);

const MARK_REMOVED = db.prepare(`
    UPDATE aggregated_jobs
    SET status = ?, updated_at = datetime('now')
    WHERE source = ? AND external_id = ?
`);

const MARK_EXPIRED = db.prepare(`
    UPDATE aggregated_jobs
    SET status = ?, updated_at = datetime('now')
    WHERE status = 'ACTIVE' AND deadline IS NOT NULL AND deadline < datetime('now')
`);

/**
 * Jobs a source stopped listing are marked REMOVED (never hard-deleted).
 * Only runs when the source actually returned listings, so a transient empty
 * response cannot wipe a source.
 */
function removeUnlisted(sourceName, presentExternalIds) {
    const present = new Set(presentExternalIds);
    const active = LIST_ACTIVE_BY_SOURCE.all(sourceName);
    let removed = 0;
    for (const row of active) {
        if (!present.has(row.external_id)) {
            MARK_REMOVED.run("REMOVED", sourceName, row.external_id);
            removed += 1;
        }
    }
    return removed;
}

/**
 * Marks any ACTIVE job whose deadline has passed as EXPIRED.
 */
function sweepExpired() {
    const result = MARK_EXPIRED.run("EXPIRED");
    return result.changes;
}

function initializeSourceRecords() {
    for (const source of getSources()) {
        UPSERT_SOURCE_RECORD.run(
            source.name,
            source.type,
            source.enabled ? 1 : 0,
            source.syncIntervalMinutes
        );
    }
}

function recordSyncLog(log, record) {
    const base = {
        source: record.source,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        durationMs: null,
        status: "ERROR",
        fetched: 0,
        inserted: 0,
        updated: 0,
        duplicates: 0,
        rejected: 0,
        error: null
    };
    const merged = { ...base, ...log, ...record };
    INSERT_SYNC_LOG.run(
        merged.source,
        merged.startedAt,
        merged.finishedAt,
        merged.durationMs,
        merged.status,
        merged.fetched,
        merged.inserted,
        merged.updated,
        merged.duplicates,
        merged.rejected,
        merged.error
    );
}

function syncCounts() {
    return {
        fetched: 0,
        inserted: 0,
        updated: 0,
        duplicates: 0,
        rejected: 0
    };
}

/**
 * Runs the full pipeline for one source:
 *   fetch -> normalize -> validate -> deduplicate -> insert/update.
 * A failure inside a single record never aborts the source; only a total
 * fetch failure (or adapter error) marks the source as ERROR.
 */
async function syncSource(sourceName) {
    const adapter = getSource(sourceName);
    if (!adapter) {
        throw new Error(`Unknown source adapter: ${sourceName}`);
    }

    const dbSource = GET_SOURCE_RECORD.get(sourceName);
    const enabled = dbSource ? Boolean(dbSource.enabled) : adapter.enabled;
    if (!adapter.enabled && !dbSource) {
        logger.warn(`syncSource: source "${sourceName}" is disabled in code; skipping.`);
        return { source: sourceName, status: "SKIPPED" };
    }
    if (!enabled) {
        logger.warn(`syncSource: source "${sourceName}" is disabled; skipping.`);
        return { source: sourceName, status: "SKIPPED" };
    }

    const startedAt = new Date().toISOString();
    const counts = syncCounts();

    logger.info("SYNC START", { source: sourceName });

    MARK_RUNNING.run(SOURCE_STATUS.RUNNING, sourceName);

    try {
        const rawJobs = await adapter.fetchJobs();

        if (!Array.isArray(rawJobs)) {
            throw new Error("fetchJobs() must resolve to an array of records.");
        }

        counts.fetched = rawJobs.length;

        for (const raw of rawJobs) {
            try {
                const job = normalizeRawJob(raw, sourceName);
                const result = upsertJob(job);
                if (result.action === "insert") counts.inserted += 1;
                else if (result.action === "update") counts.updated += 1;
                else counts.duplicates += 1;
            } catch (error) {
                counts.rejected += 1;
                logger.warn("syncSource: record rejected", {
                    source: sourceName,
                    error: error.message
                });
            }
        }

        MARK_OK.run(
            SOURCE_STATUS.OK,
            counts.fetched,
            counts.inserted,
            counts.updated,
            counts.duplicates,
            counts.rejected,
            sourceName
        );

        const removed = removeUnlisted(sourceName, rawJobs.map((raw) => String(raw.id ?? raw.external_id ?? raw.externalId ?? "")));

        const finishedAt = new Date().toISOString();
        const durationMs = Date.now() - Date.parse(startedAt);

        recordSyncLog(
            {
                finishedAt,
                durationMs,
                status: "SUCCESS",
                error: null
            },
            { source: sourceName, ...counts }
        );

        logger.info("SYNC COMPLETE", { source: sourceName, ...counts, removed, durationMs });

        return {
            source: sourceName,
            status: "SUCCESS",
            ...counts,
            removed,
            durationMs
        };
    } catch (error) {
        MARK_ERROR.run(
            SOURCE_STATUS.ERROR,
            error.message,
            counts.fetched,
            counts.inserted,
            counts.updated,
            counts.duplicates,
            counts.rejected,
            sourceName
        );

        const finishedAt = new Date().toISOString();
        const durationMs = Date.now() - Date.parse(startedAt);

        recordSyncLog(
            {
                finishedAt,
                durationMs,
                status: "ERROR",
                error: error.message
            },
            { source: sourceName, ...counts }
        );

        logger.error("SYNC ERROR", { source: sourceName, error: error.message });

        return {
            source: sourceName,
            status: "ERROR",
            ...counts,
            durationMs,
            error: error.message
        };
    }
}

/**
 * Syncs every enabled source. Each source is isolated — one source failing
 * never prevents the others from running.
 */
async function syncAllSources() {
    initializeSourceRecords();
    const results = [];
    for (const source of getSources()) {
        results.push(await syncSource(source.name));
    }
    return results;
}

module.exports = {
    initializeSourceRecords,
    syncSource,
    syncAllSources,
    sweepExpired,
    removeUnlisted,
    GET_SOURCE_RECORD
};

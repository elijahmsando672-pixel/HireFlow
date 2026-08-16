const cron = require("node-cron");
const config = require("../config");
const { getSources } = require("./sourceConfig");
const { initializeSourceRecords, syncSource, sweepExpired, GET_SOURCE_RECORD } = require("./aggregator");
const logger = require("./logger");

const inFlight = new Set();

/**
 * Per-source due check. Each source runs on its own interval
 * (DB override > adapter default > global JOB_SYNC_INTERVAL_MINUTES).
 */
function sourceDue(source, record) {
    if (inFlight.has(source.name)) return false;
    if (!record) return true;

    const intervalMinutes =
        record.sync_interval_minutes ||
        source.syncIntervalMinutes ||
        config.JOB_SYNC_INTERVAL_MINUTES;

    if (!record.last_sync) return true;

    const nextRun = Date.parse(record.last_sync + "Z") + intervalMinutes * 60 * 1000;
    return Date.now() >= nextRun;
}

async function tick(force = false) {
    const sources = getSources();
    for (const source of sources) {
        const record = GET_SOURCE_RECORD.get(source.name);
        if (!record || !record.enabled) {
            logger.debug(`scheduler: source "${source.name}" disabled, skipping.`);
            continue;
        }
        if (!force && !sourceDue(source, record)) continue;

        inFlight.add(source.name);
        try {
            await syncSource(source.name);
        } catch (error) {
            logger.error("scheduler: syncSource threw", { source: source.name, error: error.message });
        } finally {
            inFlight.delete(source.name);
        }
    }
}

function startScheduler() {
    if (!config.AGGREGATION_ENABLED) {
        logger.info("scheduler: job aggregation is disabled (AGGREGATION_ENABLED=false).");
        return null;
    }

    initializeSourceRecords();

    // Minute tick — cheap due-check, no overlapping runs per source.
    const syncJob = cron.schedule("* * * * *", () => {
        tick(false).catch((error) => logger.error("scheduler: tick failed", { error: error.message }));
    });

    // Hourly maintenance: mark past-deadline jobs as EXPIRED.
    const maintenanceJob = cron.schedule("0 * * * *", () => {
        const count = sweepExpired();
        logger.info(`scheduler: swept ${count} expired jobs.`);
    });

    if (config.RUN_SYNC_ON_START) {
        logger.info("scheduler: RUN_SYNC_ON_START=true, running initial sync.");
        tick(true).catch((error) => logger.error("scheduler: initial sync failed", { error: error.message }));
    }

    logger.info("scheduler: started (tick every minute, maintenance hourly).");
    return { syncJob, maintenanceJob };
}

module.exports = { startScheduler, tick, sourceDue, inFlight };

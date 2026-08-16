// Manual aggregation trigger:  node server/aggregation/cli.js [sourceName]
// Run via:  npm run sync:jobs
// With an optional source name to sync a single source.

const { syncSource, syncAllSources, initializeSourceRecords, sweepExpired } = require("./aggregator");
const logger = require("./logger");

async function main() {
    initializeSourceRecords();

    const requested = process.argv[2];

    if (requested) {
        const result = await syncSource(requested);
        printResult(result);
    } else {
        const results = await syncAllSources();
        results.forEach(printResult);
    }

    const expired = sweepExpired();
    logger.info(`Manual sync finished. ${expired} expired jobs swept.`);
    process.exit(0);
}

function printResult(result) {
    const line = [
        `source=${result.source}`,
        `status=${result.status}`,
        `fetched=${result.fetched}`,
        `inserted=${result.inserted}`,
        `updated=${result.updated}`,
        `duplicates=${result.duplicates}`,
        `rejected=${result.rejected}`,
        `durationMs=${result.durationMs}`
    ];
    if (result.removed !== undefined) line.push(`removed=${result.removed}`);
    if (result.error) line.push(`error="${result.error}"`);
    logger.info("SYNC RESULT " + line.join(" "));
}

main().catch((error) => {
    logger.error("Manual sync failed.", { error: error.message });
    process.exit(1);
});

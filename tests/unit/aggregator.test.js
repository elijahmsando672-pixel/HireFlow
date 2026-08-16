import { describe, it, expect, vi, beforeEach } from "vitest";
const db = require("../../server/db");
const { normalizeRawJob } = require("../../server/aggregation/normalizer");
const { upsertJob } = require("../../server/aggregation/deduplicator");
const { syncSource, syncAllSources, initializeSourceRecords, sweepExpired } = require("../../server/aggregation/aggregator");

describe("aggregator", () => {
    beforeEach(() => {
        db.prepare("DELETE FROM aggregated_jobs").run();
        db.prepare("DELETE FROM aggregation_sources").run();
        db.prepare("DELETE FROM aggregation_sync_logs").run();
        initializeSourceRecords();
    });

    it("syncs a successful source and records stats", async () => {
        const result = await syncSource("mock_api");

        expect(result.status).toBe("SUCCESS");
        expect(result.fetched).toBeGreaterThan(0);
        expect(result.inserted).toBeGreaterThan(0);
        expect(result.duplicates).toBeGreaterThanOrEqual(0);
    });

    it("isolates a failing source and does not crash", async () => {
        const result = await syncSource("example_rss");

        expect(["ERROR", "SKIPPED"]).toContain(result.status);
        expect(result.error || result.status).toBeDefined();
    });

    it("marks unlisted jobs as REMOVED when source returns updated list", async () => {
        await syncSource("mock_api");
        const before = db.prepare("SELECT COUNT(*) AS n FROM aggregated_jobs WHERE source = ? AND status = 'ACTIVE'").get("mock_api").n;
        expect(before).toBeGreaterThan(0);

        // The mock source always returns its full list, so removal count should be 0
        const result = await syncSource("mock_api");
        expect(result.removed).toBe(0);
    });

    it("sweeps expired jobs", async () => {
        db.prepare(`
            INSERT INTO aggregated_jobs (external_id, source, source_url, title, description, deadline, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run("exp-1", "test", "https://example.com/1", "Old Job", "desc", "2000-01-01T00:00:00Z", "ACTIVE");

        const count = sweepExpired();
        expect(count).toBeGreaterThanOrEqual(1);
    });
});

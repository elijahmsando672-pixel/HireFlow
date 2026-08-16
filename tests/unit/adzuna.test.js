import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const db = require("../../server/db");
const { syncSource, initializeSourceRecords } = require("../../server/aggregation/aggregator");

describe("adzuna source integration", () => {
    const ORIGINAL_ENV = { ...process.env };

    beforeEach(() => {
        db.prepare("DELETE FROM aggregated_jobs").run();
        db.prepare("DELETE FROM aggregation_sources").run();
        db.prepare("DELETE FROM aggregation_sync_logs").run();
        initializeSourceRecords();
    });

    afterEach(() => {
        Object.assign(process.env, ORIGINAL_ENV);
        vi.restoreAllMocks();
    });

    it("skips when ADZUNA_ENABLED is false", async () => {
        process.env.ADZUNA_ENABLED = "false";
        db.prepare("UPDATE aggregation_sources SET enabled = 0 WHERE name = 'adzuna'").run();

        const result = await syncSource("adzuna");
        expect(result.status).toBe("SKIPPED");
    });

    it("returns error when credentials are missing", async () => {
        process.env.ADZUNA_APP_ID = "";
        process.env.ADZUNA_APP_KEY = "";

        const result = await syncSource("adzuna");
        expect(result.status).toBe("ERROR");
        expect(result.error).toContain("Adzuna credentials are missing");
    });

    it("handles HTTP 401 gracefully", async () => {
        process.env.ADZUNA_APP_ID = "test-id";
        process.env.ADZUNA_APP_KEY = "test-key";
        process.env.ADZUNA_MAX_PAGES = "1";

        vi.spyOn(global, "fetch").mockResolvedValue({
            status: 401,
            ok: false,
            json: () => Promise.resolve({})
        });

        const result = await syncSource("adzuna");
        expect(result.status).toBe("ERROR");
        expect(result.error).toContain("authentication failed");
    });

    it("handles HTTP 429 gracefully", async () => {
        process.env.ADZUNA_APP_ID = "test-id";
        process.env.ADZUNA_APP_KEY = "test-key";
        process.env.ADZUNA_MAX_PAGES = "1";

        vi.spyOn(global, "fetch").mockResolvedValue({
            status: 429,
            ok: false,
            json: () => Promise.resolve({})
        });

        const result = await syncSource("adzuna");
        expect(result.status).toBe("ERROR");
        expect(result.error).toContain("rate limit");
    });

    it("inserts jobs into database on success", async () => {
        process.env.ADZUNA_APP_ID = "test-id";
        process.env.ADZUNA_APP_KEY = "test-key";
        process.env.ADZUNA_MAX_PAGES = "1";
        process.env.ADZUNA_SEARCH_TERMS = "software developer";

        vi.spyOn(global, "fetch").mockResolvedValue({
            status: 200,
            ok: true,
            json: () => Promise.resolve({
                results: [
                    {
                        id: "adz-001",
                        title: "Test Developer",
                        company: { display_name: "TestCo" },
                        location: { display_name: "Nairobi" },
                        description: "Test description",
                        category: { label: "Software" },
                        contract_type: "Full-time",
                        salary_min: 50000,
                        salary_max: 80000,
                        salary_currency: "KES",
                        created: "2026-08-16T00:00:00Z",
                        redirect_url: "https://example.com/job/1",
                        tags: ["javascript", "react"]
                    }
                ]
            })
        });

        const result = await syncSource("adzuna");
        expect(result.status).toBe("SUCCESS");
        expect(result.fetched).toBe(1);
        expect(result.inserted).toBe(1);
    });

    it("does not create duplicates on repeated sync", async () => {
        process.env.ADZUNA_APP_ID = "test-id";
        process.env.ADZUNA_APP_KEY = "test-key";
        process.env.ADZUNA_MAX_PAGES = "1";
        process.env.ADZUNA_SEARCH_TERMS = "software developer";

        vi.spyOn(global, "fetch").mockResolvedValue({
            status: 200,
            ok: true,
            json: () => Promise.resolve({
                results: [
                    {
                        id: "adz-dup-001",
                        title: "Duplicate Test",
                        company: { display_name: "TestCo" },
                        location: { display_name: "Remote" },
                        description: "Test",
                        category: { label: "Software" },
                        contract_type: "Contract",
                        salary_min: 1000,
                        salary_max: 1000,
                        salary_currency: "KES",
                        created: "2026-08-16T00:00:00Z",
                        redirect_url: "https://example.com/job/2",
                        tags: []
                    }
                ]
            })
        });

        await syncSource("adzuna");
        const before = db.prepare("SELECT COUNT(*) AS n FROM aggregated_jobs WHERE source = 'adzuna'").get().n;

        await syncSource("adzuna");
        const after = db.prepare("SELECT COUNT(*) AS n FROM aggregated_jobs WHERE source = 'adzuna'").get().n;

        expect(after).toBe(before);
    });

    it("marks unlisted jobs as REMOVED when source returns updated list", async () => {
        process.env.ADZUNA_APP_ID = "test-id";
        process.env.ADZUNA_APP_KEY = "test-key";
        process.env.ADZUNA_MAX_PAGES = "1";
        process.env.ADZUNA_SEARCH_TERMS = "software developer";

        vi.spyOn(global, "fetch").mockResolvedValue({
            status: 200,
            ok: true,
            json: () => Promise.resolve({ results: [] })
        });

        db.prepare(`
            INSERT INTO aggregated_jobs (external_id, source, source_url, title, description, status)
            VALUES (?, ?, ?, ?, ?, 'ACTIVE')
        `).run("adz-removed", "adzuna", "https://example.com/old", "Old Job", "desc");

        const before = db.prepare("SELECT COUNT(*) AS n FROM aggregated_jobs WHERE source = 'adzuna' AND status = 'ACTIVE'").get().n;
        expect(before).toBe(1);

        const result = await syncSource("adzuna");
        expect(result.status).toBe("SUCCESS");

        const after = db.prepare("SELECT COUNT(*) AS n FROM aggregated_jobs WHERE source = 'adzuna' AND status = 'ACTIVE'").get().n;
        expect(after).toBe(0);
    });
});

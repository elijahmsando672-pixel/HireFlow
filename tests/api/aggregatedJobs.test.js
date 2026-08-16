import { describe, it, expect, beforeAll, afterAll } from "vitest";
const request = require("supertest");
const app = require("../../server/app");
const db = require("../../server/db");

describe("aggregated-jobs API", () => {
    beforeAll(() => {
        db.prepare("DELETE FROM aggregated_jobs").run();
    });

    afterAll(() => {
        db.prepare("DELETE FROM aggregated_jobs").run();
    });

    function seedJob(overrides = {}) {
        const job = {
            external_id: "api-test-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
            source: "test_api",
            source_url: "https://example.com/" + Date.now(),
            title: "Test Job",
            description: "A test job description.",
            company_name: "TestCo",
            category: "software",
            skills: JSON.stringify(["test"]),
            budget_min: 100,
            budget_max: 200,
            currency: "KES",
            payment_type: "fixed",
            job_type: "contract",
            experience_level: "junior",
            location: "Nairobi",
            remote: 0,
            posted_at: "2026-01-01T00:00:00Z",
            status: "ACTIVE",
            content_hash: "abc123",
            ...overrides
        };

        const keys = Object.keys(job);
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map((k) => job[k]);

        db.prepare(`INSERT INTO aggregated_jobs (${keys.join(", ")}) VALUES (${placeholders})`).run(...values);

        return db.prepare("SELECT last_insert_rowid() AS id").get().id;
    }

    it("returns empty list when no jobs exist", async () => {
        const res = await request(app).get("/api/aggregated-jobs");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual([]);
        expect(res.body.pagination.total).toBe(0);
    });

    it("lists jobs with pagination", async () => {
        seedJob({ title: "Job A" });
        seedJob({ title: "Job B" });

        const res = await request(app).get("/api/aggregated-jobs?limit=1&page=1");
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.pagination.total).toBe(2);
        expect(res.body.pagination.totalPages).toBe(2);
    });

    it("filters by category", async () => {
        seedJob({ category: "software", title: "Software Job" });
        seedJob({ category: "design", title: "Design Job" });

        const res = await request(app).get("/api/aggregated-jobs?category=software");
        expect(res.status).toBe(200);
        expect(res.body.data.every((j) => j.category === "software")).toBe(true);
    });

    it("filters by remote", async () => {
        seedJob({ remote: 1, title: "Remote Job" });
        seedJob({ remote: 0, title: "Onsite Job" });

        const res = await request(app).get("/api/aggregated-jobs?remote=true");
        expect(res.status).toBe(200);
        expect(res.body.data.every((j) => j.remote === true)).toBe(true);
    });

    it("searches across title, company, description and skills", async () => {
        seedJob({ title: "React Developer", company_name: "Acme", description: "Build UIs", skills: JSON.stringify(["react"]) });

        const res = await request(app).get("/api/aggregated-jobs?search=react");
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("returns 400 for invalid query params", async () => {
        const res = await request(app).get("/api/aggregated-jobs?limit=abc");
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 for missing job id", async () => {
        const res = await request(app).get("/api/aggregated-jobs/99999");
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    it("returns a single job by id", async () => {
        const id = seedJob({ title: "Unique Job" });
        const res = await request(app).get("/api/aggregated-jobs/" + id);
        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe("Unique Job");
    });

    it("returns categories and skills aggregates", async () => {
        seedJob({ category: "software", skills: JSON.stringify(["js", "ts"]) });
        seedJob({ category: "software", skills: JSON.stringify(["js"]) });

        const catRes = await request(app).get("/api/aggregated-jobs/categories");
        expect(catRes.status).toBe(200);
        expect(catRes.body.data.length).toBeGreaterThanOrEqual(1);

        const skillRes = await request(app).get("/api/aggregated-jobs/skills");
        expect(skillRes.status).toBe(200);
        expect(skillRes.body.data.some((s) => s.name === "js")).toBe(true);
    });
});

describe("admin aggregation API", () => {
    it("rejects unauthenticated admin requests", async () => {
        const res = await request(app).get("/api/admin/aggregation/stats");
        expect(res.status).toBe(401);
    });
});

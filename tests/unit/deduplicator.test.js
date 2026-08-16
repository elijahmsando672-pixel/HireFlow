import { describe, it, expect, beforeEach } from "vitest";
const db = require("../../server/db");
const { upsertJob, contentHash, tokenSimilarity } = require("../../server/aggregation/deduplicator");

describe("deduplicator", () => {
    beforeEach(() => {
        db.prepare("DELETE FROM aggregated_jobs").run();
    });

    it("inserts a new job", () => {
        const result = upsertJob({
            externalId: "ex-1",
            source: "src",
            sourceUrl: "https://example.com/1",
            title: "React Dev",
            description: "desc",
            companyName: "Acme",
            category: "web",
            skills: ["react"],
            budgetMin: 100,
            budgetMax: 200,
            currency: "KES",
            paymentType: "fixed",
            jobType: "contract",
            experienceLevel: "junior",
            location: "Nairobi",
            remote: false,
            postedAt: "2026-01-01T00:00:00Z",
            deadline: null,
            status: "ACTIVE",
            rawData: null
        });

        expect(result.action).toBe("insert");
        expect(result.id).toBeDefined();
    });

    it("classifies same source+external_id with same hash as duplicate", () => {
        const job = {
            externalId: "ex-2",
            source: "src",
            sourceUrl: "https://example.com/2",
            title: "Dev",
            description: "desc",
            companyName: "Acme",
            category: "web",
            skills: ["react"],
            budgetMin: 100,
            budgetMax: 200,
            currency: "KES",
            paymentType: "fixed",
            jobType: "contract",
            experienceLevel: "junior",
            location: "Nairobi",
            remote: false,
            postedAt: "2026-01-01T00:00:00Z",
            deadline: null,
            status: "ACTIVE",
            rawData: null
        };

        const first = upsertJob(job);
        const second = upsertJob(job);

        expect(first.action).toBe("insert");
        expect(second.action).toBe("duplicate");
        expect(second.reason).toBe("level-1");
    });

    it("updates when source+external_id reappears with changed content", () => {
        const base = {
            externalId: "ex-3",
            source: "src",
            sourceUrl: "https://example.com/3",
            title: "Dev",
            description: "desc v1",
            companyName: "Acme",
            category: "web",
            skills: ["react"],
            budgetMin: 100,
            budgetMax: 200,
            currency: "KES",
            paymentType: "fixed",
            jobType: "contract",
            experienceLevel: "junior",
            location: "Nairobi",
            remote: false,
            postedAt: "2026-01-01T00:00:00Z",
            deadline: null,
            status: "ACTIVE",
            rawData: null
        };

        const first = upsertJob(base);
        const updated = upsertJob({ ...base, description: "desc v2" });

        expect(first.action).toBe("insert");
        expect(updated.action).toBe("update");
        expect(updated.id).toBe(first.id);
    });

    it("detects duplicates by content hash across sources", () => {
        const job = {
            externalId: "ex-4",
            source: "src-a",
            sourceUrl: "https://example.com/4a",
            title: "Dev",
            description: "same desc",
            companyName: "Acme",
            category: "web",
            skills: ["react"],
            budgetMin: 100,
            budgetMax: 200,
            currency: "KES",
            paymentType: "fixed",
            jobType: "contract",
            experienceLevel: "junior",
            location: "Nairobi",
            remote: false,
            postedAt: "2026-01-01T00:00:00Z",
            deadline: null,
            status: "ACTIVE",
            rawData: null
        };

        const first = upsertJob(job);
        const second = upsertJob({ ...job, externalId: "ex-4-b", source: "src-b", sourceUrl: "https://example.com/4b" });

        expect(first.action).toBe("insert");
        expect(second.action).toBe("duplicate");
        expect(second.reason).toBe("level-2-hash");
    });

    it("computes stable content hashes", () => {
        const a = contentHash({ title: "Dev", companyName: "Acme", location: "Nairobi", category: "web", jobType: "contract", experienceLevel: "junior", description: "desc" });
        const b = contentHash({ title: "Dev", companyName: "Acme", location: "Nairobi", category: "web", jobType: "contract", experienceLevel: "junior", description: "desc" });
        expect(a).toBe(b);
        expect(a.length).toBe(64);
    });

    it("computes token similarity correctly", () => {
        expect(tokenSimilarity("react developer", "developer react")).toBeCloseTo(1, 5);
        expect(tokenSimilarity("python job", "java job")).toBeGreaterThan(0);
        expect(tokenSimilarity("", "anything")).toBe(0);
    });
});

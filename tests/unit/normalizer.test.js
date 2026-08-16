import { describe, it, expect } from "vitest";
const { normalizeRawJob } = require("../../server/aggregation/normalizer");

describe("normalizer", () => {
    it("normalizes title and description whitespace", () => {
        const job = normalizeRawJob({
            id: "test-1",
            title: "  React   Developer  ",
            description: "Build\n  apps\r\nwith React.",
            sourceUrl: "https://example.com/1"
        }, "test");

        expect(job.title).toBe("React Developer");
        expect(job.description).toBe("Build apps with React.");
    });

    it("normalizes skills into a deduplicated lowercase array", () => {
        const job = normalizeRawJob({
            id: "test-2",
            title: "Dev",
            description: "desc",
            sourceUrl: "https://example.com/2",
            skills: ["React", "NODE.JS", "react", "PostgreSQL"]
        }, "test");

        expect(job.skills).toEqual(["react", "node.js", "postgresql"]);
    });

    it("normalizes job types to canonical values", () => {
        const cases = [
            ["Full-time", "full-time"],
            ["full time", "full-time"],
            ["Contract", "contract"],
            ["Freelance", "freelance"],
            ["Part-time", "part-time"],
            ["Internship", "internship"]
        ];

        for (const [raw, expected] of cases) {
            const job = normalizeRawJob({
                id: "type-" + raw,
                title: "Dev",
                description: "desc",
                sourceUrl: "https://example.com/" + raw,
                type: raw
            }, "test");

            expect(job.jobType).toBe(expected);
        }
    });

    it("normalizes experience levels", () => {
        const cases = [
            ["Entry", "entry"],
            ["Junior", "junior"],
            ["Mid", "intermediate"],
            ["Senior", "senior"],
            ["Expert", "expert"]
        ];

        for (const [raw, expected] of cases) {
            const job = normalizeRawJob({
                id: "exp-" + raw,
                title: "Dev",
                description: "desc",
                sourceUrl: "https://example.com/" + raw,
                level: raw
            }, "test");

            expect(job.experienceLevel).toBe(expected);
        }
    });

    it("normalizes currency codes", () => {
        const cases = [
            ["KES", "KES"],
            ["Ksh", "KES"],
            ["USD", "USD"],
            ["EUR", "EUR"],
            ["GBP", "GBP"]
        ];

        for (const [raw, expected] of cases) {
            const job = normalizeRawJob({
                id: "cur-" + raw,
                title: "Dev",
                description: "desc",
                sourceUrl: "https://example.com/" + raw,
                budget: raw + " 1000"
            }, "test");

            expect(job.currency).toBe(expected);
        }
    });

    it("parses budget strings into min/max/currency/paymentType", () => {
        const job = normalizeRawJob({
            id: "budget-1",
            title: "Dev",
            description: "desc",
            sourceUrl: "https://example.com/b1",
            budget: "$1,200 - $1,800"
        }, "test");

        expect(job.budgetMin).toBe(1200);
        expect(job.budgetMax).toBe(1800);
        expect(job.currency).toBe("USD");
        expect(job.paymentType).toBe("fixed");
    });

    it("detects remote from location string and remote flag", () => {
        const job = normalizeRawJob({
            id: "remote-1",
            title: "Dev",
            description: "desc",
            sourceUrl: "https://example.com/r1",
            location: "Remote - Nairobi",
            remote: true
        }, "test");

        expect(job.remote).toBe(true);
        expect(job.location).toBe("Nairobi");
    });

    it("throws on missing required fields", () => {
        expect(() => normalizeRawJob({}, "test")).toThrow();
        expect(() => normalizeRawJob({ title: "Dev" }, "test")).toThrow();
    });
});

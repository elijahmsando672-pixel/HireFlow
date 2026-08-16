import { describe, it, expect, vi, beforeEach } from "vitest";
const { sourceDue, tick } = require("../../server/aggregation/scheduler");
const db = require("../../server/db");

describe("scheduler", () => {
    beforeEach(() => {
        db.prepare("DELETE FROM aggregation_sources").run();
        db.prepare("DELETE FROM aggregation_sync_logs").run();
    });

    it("sourceDue returns true when no record exists", () => {
        const source = { name: "new_src", syncIntervalMinutes: 30 };
        expect(sourceDue(source, null)).toBe(true);
    });

    it("sourceDue respects in-flight guard", () => {
        const source = { name: "in_flight_src", syncIntervalMinutes: 30 };
        const record = { enabled: 1, last_sync: new Date().toISOString() };

        // Manually simulate in-flight
        const { inFlight } = require("../../server/aggregation/scheduler");
        inFlight.add(source.name);

        expect(sourceDue(source, record)).toBe(false);

        inFlight.delete(source.name);
    });

    it("sourceDue uses DB interval override over default", () => {
        const source = { name: "override_src", syncIntervalMinutes: 30 };
        const now = new Date().toISOString();
        const record = { enabled: 1, last_sync: now, sync_interval_minutes: 60 };

        // 60 minutes from now should not be due
        expect(sourceDue(source, record)).toBe(false);
    });
});

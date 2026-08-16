/**
 * Source adapter contract (the "interface").
 *
 * Every job source must be an object with this shape:
 *
 * {
 *   name: string,                  // unique machine key, e.g. "example_api"
 *   label: string,                 // human readable name for the UI
 *   type: "API" | "RSS",
 *   enabled: boolean,              // false = configured but never fetched
 *   syncIntervalMinutes: number,   // per-source frequency override
 *   description: string,           // how this data is legally obtained
 *   fetchJobs(): Promise<ExternalJob[]>
 * }
 *
 * `fetchJobs` must resolve to an array of raw records. Each record is any
 * shape the source provides; the normalizer converts it to the canonical
 * form. Raw records MUST be obtainable legally (official API, public feed,
 * or a site whose terms allow automated collection). Never bypass
 * CAPTCHAs, auth, paywalls, or anti-bot systems.
 *
 * New sources are added by creating a module that exports this shape and
 * registering it in `sourceConfig.js`. No changes to the aggregation engine
 * are required.
 */

const { JOB_TYPES, EXPERIENCE_LEVELS, PAYMENT_TYPES } = require("./constants");

const REQUIRED_KEYS = ["name", "label", "type", "enabled", "fetchJobs"];

function createSourceAdapter(definition) {
    const missing = REQUIRED_KEYS.filter((key) => !(key in definition));
    if (missing.length > 0) {
        throw new Error(
            `Source adapter "${definition.name || "<unnamed>"}" is missing required properties: ${missing.join(", ")}`
        );
    }

    if (typeof definition.fetchJobs !== "function") {
        throw new Error(`Source adapter "${definition.name}" must implement fetchJobs().`);
    }

    if (!["API", "RSS", "CUSTOM"].includes(definition.type)) {
        throw new Error(`Source adapter "${definition.name}" has an unknown type "${definition.type}".`);
    }

    const interval = parseInt(definition.syncIntervalMinutes, 10);

    return {
        name: definition.name,
        label: definition.label || definition.name,
        type: definition.type,
        enabled: definition.enabled !== false,
        syncIntervalMinutes: Number.isFinite(interval) && interval > 0 ? interval : null,
        description: definition.description || "",
        fetchJobs: definition.fetchJobs
    };
}

// Reference of canonical values — useful for adapters that want to conform.
const ALLOWED = {
    jobTypes: JOB_TYPES,
    experienceLevels: EXPERIENCE_LEVELS,
    paymentTypes: PAYMENT_TYPES
};

module.exports = { createSourceAdapter, ALLOWED };

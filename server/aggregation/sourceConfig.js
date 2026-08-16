const { createSourceAdapter } = require("./sourceAdapter");

/**
 * Source registry. To add a new source, create an adapter module under
 * ./sources and register it here. The aggregation engine reads from
 * `getSources()` and needs no changes.
 *
 * Enabling/disabling and per-source intervals can be overridden in the
 * database through the source management API without touching code, as long
 * as the adapter's `enabled` default is true.
 */

const mockApiSource = require("./sources/mockApiSource");
const exampleRssSource = require("./sources/exampleRssSource");
const adzunaSource = require("./sources/adzunaSource");

const REGISTERED = [
    mockApiSource,
    exampleRssSource,
    adzunaSource
];

function getSources() {
    return REGISTERED.map((definition) => createSourceAdapter(definition));
}

function getSource(name) {
    return REGISTERED.find((source) => source.name === name) || null;
}

module.exports = { getSources, getSource };

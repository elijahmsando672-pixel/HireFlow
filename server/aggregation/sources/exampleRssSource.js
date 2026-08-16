const { createSourceAdapter } = require("../sourceAdapter");

/**
 * Example RSS/Atom feed adapter.
 *
 * STATUS: DISABLED.
 *
 * This adapter exists to demonstrate how a feed-based source is plugged in.
 * It is left disabled because the demo feed below does not exist, and we do
 * not collect from any feed without confirming the publisher permits it.
 *
 * To enable a REAL feed:
 *   1. Confirm the publisher allows automated collection (public feed, no
 *      terms/robots restriction against it).
 *   2. Point `feedUrl` at the real feed.
 *   3. Implement feed parsing below (add a dependency such as `rss-parser`
 *      or parse with a tiny XML parser). An XML parser package is intentionally
 *      NOT installed here since the source is disabled.
 *   4. Flip `enabled` to true.
 *
 * The adapter interface stays the same: return an array of raw records, and
 * the normalizer handles the rest.
 */

const feedUrl = "https://example.com/feed.xml";

async function fetchJobs() {
    throw new Error(
        `Example RSS source is disabled. Provide an authorized feed URL and a parser, then enable it in ${__filename}.`
    );
}

module.exports = createSourceAdapter({
    name: "example_rss",
    label: "Example RSS feed (disabled)",
    type: "RSS",
    enabled: false,
    syncIntervalMinutes: 60,
    description:
        "Template for authorized RSS/Atom feeds. Disabled: requires a real publisher-authorized feed URL and an XML parser.",
    fetchJobs
});

// Keep a reference so the URL is visible in source config tooling.
module.exports.feedUrl = feedUrl;

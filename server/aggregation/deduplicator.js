const crypto = require("crypto");
const db = require("../db");

// Two levels of duplicate detection:
//   Level 1 - exact: unique (source, external_id) constraint.
//   Level 2 - possible duplicate: same normalized content hash across any
//             source, or a fuzzy token-overlap similarity on title+company.
//
// A row is only UPDATED when a known source+external_id re-appears with
// different content. Identical re-emissions are classified as duplicates.

const SIMILARITY_THRESHOLD = 0.8;
const SIMILARITY_SCAN_LIMIT = 5000;

function collapse(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function contentHash(job) {
    const fingerprint = [
        collapse(job.title),
        collapse(job.companyName),
        collapse(job.location),
        collapse(job.category),
        collapse(job.jobType),
        collapse(job.experienceLevel),
        collapse(job.description)
    ].join("|");
    return crypto.createHash("sha256").update(fingerprint).digest("hex");
}

function tokenize(text) {
    return collapse(text)
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2);
}

function tokenSimilarity(a, b) {
    const tokensA = new Set(tokenize(a));
    const tokensB = new Set(tokenize(b));
    if (tokensA.size === 0 || tokensB.size === 0) return 0;
    let intersection = 0;
    for (const token of tokensA) {
        if (tokensB.has(token)) intersection += 1;
    }
    return intersection / (tokensA.size + tokensB.size - intersection);
}

const SELECT_BY_SOURCE_EXTERNAL = db.prepare(`
    SELECT id, content_hash, updated_at FROM aggregated_jobs
    WHERE source = ? AND external_id = ?
`);

const SELECT_BY_HASH = db.prepare(`
    SELECT id FROM aggregated_jobs WHERE content_hash = ? LIMIT 1
`);

const SELECT_SIMILAR_CANDIDATES = db.prepare(`
    SELECT id, title, company_name, location FROM aggregated_jobs
    WHERE status = 'ACTIVE'
    ORDER BY posted_at DESC
    LIMIT ?
`);

const INSERT_JOB = db.prepare(`
    INSERT INTO aggregated_jobs (
        external_id, source, source_url, title, description,
        company_name, company_url, category, skills,
        budget_min, budget_max, currency, payment_type,
        job_type, experience_level, location, remote,
        posted_at, deadline, status, raw_data, content_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const UPDATE_JOB = db.prepare(`
    UPDATE aggregated_jobs SET
        source_url = ?, title = ?, description = ?,
        company_name = ?, company_url = ?, category = ?, skills = ?,
        budget_min = ?, budget_max = ?, currency = ?, payment_type = ?,
        job_type = ?, experience_level = ?, location = ?, remote = ?,
        posted_at = ?, deadline = ?, status = ?, raw_data = ?, content_hash = ?,
        updated_at = datetime('now')
    WHERE id = ?
`);

function toColumns(job) {
    return [
        job.externalId,
        job.source,
        job.sourceUrl,
        job.title,
        job.description,
        job.companyName,
        job.companyUrl,
        job.category,
        JSON.stringify(job.skills),
        job.budgetMin,
        job.budgetMax,
        job.currency,
        job.paymentType,
        job.jobType,
        job.experienceLevel,
        job.location,
        job.remote ? 1 : 0,
        job.postedAt,
        job.deadline,
        job.status,
        job.rawData ? JSON.stringify(job.rawData) : null
    ];
}

function updateWithHash(job) {
    const hash = contentHash(job);
    const columns = toColumns(job);
    UPDATE_JOB.run(
        ...columns.slice(2),
        hash,
        job.id
    );
    return hash;
}

function findSimilarJob(job, hash) {
    // Exact normalized match already covered by content_hash. Only fall back
    // to the fuzzy scan when there is no exact hash match.
    const candidates = SELECT_SIMILAR_CANDIDATES.all(SIMILARITY_SCAN_LIMIT);
    for (const candidate of candidates) {
        if (candidate.id === job.id) continue;
        const a = `${job.title} ${job.companyName || ""}`;
        const b = `${candidate.title} ${candidate.company_name || ""}`;
        if (tokenSimilarity(a, b) >= SIMILARITY_THRESHOLD) {
            return candidate;
        }
    }
    return null;
}

/**
 * Classifies and persists one normalized job.
 * Returns { action: "insert" | "update" | "duplicate", id? }
 */
function upsertJob(job) {
    const hash = contentHash(job);

    const existing = SELECT_BY_SOURCE_EXTERNAL.get(job.source, job.externalId);

    if (existing) {
        if (existing.content_hash === hash) {
            return { action: "duplicate", reason: "level-1", id: existing.id };
        }
        job.id = existing.id;
        updateWithHash(job);
        return { action: "update", reason: "changed", id: existing.id };
    }

    const hashMatch = SELECT_BY_HASH.get(hash);
    if (hashMatch) {
        return { action: "duplicate", reason: "level-2-hash", id: hashMatch.id };
    }

    const similar = findSimilarJob(job, hash);
    if (similar) {
        return { action: "duplicate", reason: "level-2-similarity", id: similar.id };
    }

    const info = INSERT_JOB.run(...toColumns(job), hash);
    return { action: "insert", id: info.lastInsertRowid };
}

module.exports = {
    contentHash,
    tokenSimilarity,
    upsertJob,
    SIMILARITY_THRESHOLD
};

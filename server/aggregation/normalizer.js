const { z } = require("zod");
const {
    JOB_TYPE_MAP,
    EXPERIENCE_LEVEL_MAP,
    CURRENCY_MAP,
    JOB_STATUS
} = require("./constants");

// Canonical, validated shape that every source is reduced to.
// This is the single internal contract used by dedup, storage and the API.
const NormalizedJobSchema = z.object({
    externalId: z.string().min(1),
    source: z.string().min(1),
    sourceUrl: z.string().min(1),
    title: z.string().min(1),
    description: z.string().default(""),
    companyName: z.string().nullable().default(null),
    companyUrl: z.string().nullable().default(null),
    category: z.string().nullable().default(null),
    skills: z.array(z.string()).default([]),
    budgetMin: z.number().nullable().default(null),
    budgetMax: z.number().nullable().default(null),
    currency: z.string().default("KES"),
    paymentType: z.enum(["fixed", "hourly", "monthly"]).default("fixed"),
    jobType: z.string().nullable().default(null),
    experienceLevel: z.string().nullable().default(null),
    location: z.string().nullable().default(null),
    remote: z.boolean().default(false),
    postedAt: z.string().nullable().default(null),
    deadline: z.string().nullable().default(null),
    status: z.string().default(JOB_STATUS.ACTIVE),
    rawData: z.unknown().optional()
});

const NUMERIC = /\d{1,3}(?:[.,]\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g;

function normalizeCurrency(text) {
    if (!text) return "KES";
    const lower = String(text).toLowerCase();
    const keys = Object.keys(CURRENCY_MAP).sort((a, b) => b.length - a.length);
    for (const key of keys) {
        if (lower.includes(key.toLowerCase())) return CURRENCY_MAP[key];
    }
    return "KES";
}

function detectPaymentType(text) {
    if (!text) return "fixed";
    const lower = String(text).toLowerCase();
    if (/(\/\s?hour|hourly|per hour)/.test(lower)) return "hourly";
    if (/(\/\s?month|monthly|per month|per annum)/.test(lower)) return "monthly";
    return "fixed";
}

// Converts free-form budget strings ("$1,200 - $1,800", "KES 45,000/month")
// into numeric min/max + currency + payment type.
function parseBudget(raw) {
    const text = String(raw || "").trim();
    if (!text) return { budgetMin: null, budgetMax: null, currency: "KES", paymentType: "fixed" };

    const numbers = (text.match(NUMERIC) || [])
        .map((part) => parseFloat(part.replace(/,/g, "")))
        .filter((value) => Number.isFinite(value));

    let budgetMin = null;
    let budgetMax = null;
    if (numbers.length >= 2) {
        budgetMin = Math.min(numbers[0], numbers[1]);
        budgetMax = Math.max(numbers[0], numbers[1]);
    } else if (numbers.length === 1) {
        budgetMin = numbers[0];
        budgetMax = numbers[0];
    }

    return {
        budgetMin,
        budgetMax,
        currency: normalizeCurrency(text),
        paymentType: detectPaymentType(text)
    };
}

function normalizeDate(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
}

function normalizeJobType(value) {
    if (!value) return null;
    const key = String(value).trim().toLowerCase();
    return JOB_TYPE_MAP[key] || null;
}

function normalizeExperience(value) {
    if (!value) return null;
    const key = String(value).trim().toLowerCase();
    return EXPERIENCE_LEVEL_MAP[key] || null;
}

function normalizeSkills(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    return value
        .map((skill) => String(skill).trim().toLowerCase())
        .filter((skill) => skill.length > 0 && !seen.has(skill) && seen.add(skill));
}

// "Remote - Nairobi" -> remote=true, location="Nairobi"
function normalizeLocation(rawLocation, remoteFlag) {
    const isRemote = remoteFlag === true || remoteFlag === 1 || (rawLocation || "").toLowerCase().includes("remote");
    let location = rawLocation ? String(rawLocation).trim() : null;
    if (location && location.toLowerCase().includes("remote")) {
        const remainder = location.replace(/remote[\s,\-–—]*/gi, "").replace(/^[\s,\-–—]+|[\s,\-–—]+$/g, "");
        location = remainder || null;
    }
    return { location, remote: isRemote };
}

function normalizeCategory(value) {
    if (!value) return null;
    return String(value).trim().toLowerCase() || null;
}

/**
 * Converts one raw record from any adapter into the canonical NormalizedJob.
 * Throws on records that cannot be validated.
 */
function normalizeRawJob(raw, sourceName) {
    if (!raw || typeof raw !== "object") {
        throw new Error("Raw job must be an object.");
    }

    const budget = parseBudget(raw.budget);
    const loc = normalizeLocation(raw.location, raw.remote);

    const parsed = NormalizedJobSchema.parse({
        externalId: String(raw.id ?? raw.external_id ?? raw.externalId ?? ""),
        source: sourceName,
        sourceUrl: raw.url ?? raw.source_url ?? raw.sourceUrl ?? "",
        title: String(raw.title ?? raw.position ?? "").replace(/\s+/g, " ").trim(),
        description: String(raw.description ?? raw.summary ?? "").replace(/\s+/g, " ").trim(),
        companyName: raw.company ?? raw.company_name ?? raw.employer ?? null,
        companyUrl: raw.company_url ?? raw.companyUrl ?? null,
        category: normalizeCategory(raw.category),
        skills: normalizeSkills(raw.skills ?? raw.skills_required),
        budgetMin: budget.budgetMin,
        budgetMax: budget.budgetMax,
        currency: budget.currency,
        paymentType: budget.paymentType,
        jobType: normalizeJobType(raw.type ?? raw.job_type ?? raw.employment_type),
        experienceLevel: normalizeExperience(raw.level ?? raw.experience_level ?? raw.experience),
        location: loc.location,
        remote: loc.remote,
        postedAt: normalizeDate(raw.posted ?? raw.posted_at ?? raw.created_at),
        deadline: normalizeDate(raw.deadline ?? raw.apply_by),
        status: JOB_STATUS.ACTIVE,
        rawData: raw
    });

    return parsed;
}

module.exports = { normalizeRawJob, NormalizedJobSchema };

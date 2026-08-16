const { createSourceAdapter } = require("../sourceAdapter");
const logger = require("../logger");

// Adzuna API documentation: https://developer.adzuna.com/overview
const ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs";

function getAdzunaEnv() {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    const country = (process.env.ADZUNA_COUNTRY || "gb").trim().toLowerCase();
    const resultsPerPage = Math.max(1, Math.min(50, parseInt(process.env.ADZUNA_RESULTS_PER_PAGE, 10) || 20));
    const maxPages = Math.max(1, Math.min(10, parseInt(process.env.ADZUNA_MAX_PAGES, 10) || 1));
    const searchTerms = (process.env.ADZUNA_SEARCH_TERMS || "software developer,web developer,javascript developer,python developer")
        .split(",")
        .map((term) => term.trim())
        .filter(Boolean);

    if (!appId || !appKey) {
        throw new Error(
            "Adzuna credentials are missing. Set ADZUNA_APP_ID and ADZUNA_APP_KEY in the environment."
        );
    }

    if (searchTerms.length === 0) {
        throw new Error("ADZUNA_SEARCH_TERMS must contain at least one search term.");
    }

    return { appId, appKey, country, resultsPerPage, maxPages, searchTerms };
}

async function fetchJobs() {
    let env;
    try {
        env = getAdzunaEnv();
    } catch (error) {
        throw error;
    }

    const { appId, appKey, country, resultsPerPage, maxPages, searchTerms } = env;

    const allResults = [];

    for (const term of searchTerms) {
        for (let page = 1; page <= maxPages; page++) {
            const url = `${ADZUNA_BASE_URL}/${encodeURIComponent(country)}/search/${encodeURIComponent(page)}?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}&results_per_page=${encodeURIComponent(String(resultsPerPage))}&what=${encodeURIComponent(term)}&content-type=application/json`;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            try {
                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    },
                    signal: controller.signal
                });

                clearTimeout(timeout);

                if (response.status === 401 || response.status === 403) {
                    throw new Error(`Adzuna authentication failed (HTTP ${response.status}). Check ADZUNA_APP_ID and ADZUNA_APP_KEY.`);
                }

                if (response.status === 429) {
                    throw new Error("Adzuna rate limit exceeded. Reduce max_pages or sync frequency.");
                }

                if (!response.ok) {
                    throw new Error(`Adzuna API responded with HTTP ${response.status}.`);
                }

                const data = await response.json();

                if (!data || !Array.isArray(data.results)) {
                    logger.warn("Adzuna adapter: unexpected response format.", { term, page });
                    continue;
                }

                const mapped = data.results.map((job) => ({
                    id: String(job.id || `${term}-${page}-${Math.random().toString(36).slice(2, 9)}`),
                    title: job.title,
                    company: job.company?.display_name || job.company?.name || "Confidential",
                    url: job.redirect_url || `${url}&ad_id=${encodeURIComponent(job.id)}`,
                    description: job.description,
                    category: job.category?.label || null,
                    type: job.contract_type || null,
                    budget: job.salary_min || job.salary_max ? `${job.salary_min || 0}-${job.salary_max || 0}` : null,
                    payment: job.salary_currency ? "fixed" : null,
                    level: null,
                    location: job.location?.display_name || null,
                    remote: (job.location?.display_name || "").toLowerCase().includes("remote"),
                    skills: Array.isArray(job.tags) ? job.tags : [],
                    posted: job.created || null,
                    deadline: null
                }));

                allResults.push(...mapped);

                if (data.results.length < resultsPerPage) {
                    break;
                }
            } catch (error) {
                if (error.name === "AbortError") {
                    throw new Error("Adzuna API request timed out after 15 seconds.");
                }
                throw error;
            }
        }
    }

    return allResults;
}

module.exports = createSourceAdapter({
    name: "adzuna",
    label: "Adzuna Jobs",
    type: "API",
    enabled: process.env.ADZUNA_ENABLED !== "false",
    syncIntervalMinutes: 60,
    description: "Live job listings from Adzuna job search API. Requires ADZUNA_APP_ID and ADZUNA_APP_KEY. Attribution preserved.",
    fetchJobs
});


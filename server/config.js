require("dotenv").config();

if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET must be configured in production.");
    }
    console.warn("[hireflow] No JWT_SECRET set. Using an insecure default for development only. Do NOT deploy without setting JWT_SECRET.");
}

function int(value, fallback) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

module.exports = {
    // A fallback is permitted only for local development. Production must provide
    // a unique secret so tokens cannot be forged from a public default.
    JWT_SECRET: process.env.JWT_SECRET || "hireflow-local-development-secret",
    SALT_ROUNDS: 10,
    PORT: int(process.env.PORT, 3000),
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || null,
    LOG_LEVEL: process.env.LOG_LEVEL || "info",
    // Job aggregation settings
    AGGREGATION_ENABLED: process.env.AGGREGATION_ENABLED !== "false",
    RUN_SYNC_ON_START: process.env.RUN_SYNC_ON_START === "true",
    JOB_SYNC_INTERVAL_MINUTES: int(process.env.JOB_SYNC_INTERVAL_MINUTES, 30),
    MOCK_SOURCE_ENABLED: process.env.MOCK_SOURCE_ENABLED !== "false",
    MOCK_SOURCE_FAIL_RATE: Math.max(0, Math.min(1, parseFloat(process.env.MOCK_SOURCE_FAIL_RATE) || 0)),
    // Adzuna settings
    ADZUNA_ENABLED: process.env.ADZUNA_ENABLED !== "false",
    ADZUNA_COUNTRY: (process.env.ADZUNA_COUNTRY || "gb").trim().toLowerCase(),
    ADZUNA_RESULTS_PER_PAGE: Math.max(1, Math.min(50, parseInt(process.env.ADZUNA_RESULTS_PER_PAGE, 10) || 20)),
    ADZUNA_MAX_PAGES: Math.max(1, Math.min(10, parseInt(process.env.ADZUNA_MAX_PAGES, 10) || 1)),
    ADZUNA_SEARCH_TERMS: (process.env.ADZUNA_SEARCH_TERMS || "software developer,web developer,javascript developer,python developer")
        .split(",")
        .map((term) => term.trim())
        .filter(Boolean),
    // Subscription paywall
    SUBSCRIPTION_ENABLED: process.env.SUBSCRIPTION_ENABLED !== "false",
    PAYWALL_ENABLED: process.env.PAYWALL_ENABLED !== "false",
    SUBSCRIPTION_PROVIDER: (process.env.SUBSCRIPTION_PROVIDER || "mock").trim().toLowerCase(),
    SUBSCRIPTION_PRICE_KES: int(process.env.SUBSCRIPTION_PRICE_KES, 500),
    SUBSCRIPTION_CURRENCY: (process.env.SUBSCRIPTION_CURRENCY || "KES").trim().toUpperCase(),
    SUBSCRIPTION_DURATION_DAYS: int(process.env.SUBSCRIPTION_DURATION_DAYS, 30),
    SUBSCRIPTION_PRO_PLAN: (process.env.SUBSCRIPTION_PRO_PLAN || "PRO").trim().toUpperCase(),
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
    // Pesapal payment gateway
    PESAPAL_MODE: (process.env.PESAPAL_MODE || "mock").trim().toLowerCase(),
    PESAPAL_CONSUMER_KEY: process.env.PESAPAL_CONSUMER_KEY || null,
    PESAPAL_CONSUMER_SECRET: process.env.PESAPAL_CONSUMER_SECRET || null,
    PESAPAL_BASE_URL: process.env.PESAPAL_BASE_URL || "https://cybqa.pesapal.com/pesapalv3/api",
    PESAPAL_IFRAME_URL: process.env.PESAPAL_IFRAME_URL || "https://cybqa.pesapal.com/iframeserver",
    PESAPAL_IPN_URL: process.env.PESAPAL_IPN_URL || null,
    PESAPAL_CALLBACK_URL: process.env.PESAPAL_CALLBACK_URL || null
};

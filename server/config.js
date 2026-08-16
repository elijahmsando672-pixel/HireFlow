require("dotenv").config();

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured in production.");
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
    MOCK_SOURCE_FAIL_RATE: Math.max(0, Math.min(1, parseFloat(process.env.MOCK_SOURCE_FAIL_RATE) || 0))
};

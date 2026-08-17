const express = require("express");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

// ---- Security middleware ----
app.disable("x-powered-by");
app.use(helmet());
// The production app is same-origin. Cross-origin access is opt-in for an
// explicitly configured frontend, rather than reflecting every Origin header.
const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : false }));

// ---- Rate limiting ----
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many auth attempts, please try again later." }
});

// ---- Body parsing with size limits ----
app.use(express.json({ limit: "100kb" }));

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

// ---- API routes ----
app.use("/api/auth", require("./routes/auth"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/proposals", require("./routes/proposals"));
app.use("/api/gigs", require("./routes/gigs"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/contracts", require("./routes/contracts"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/saved", require("./routes/saved"));
app.use("/api/users", require("./routes/users"));
app.use("/api/aggregated-jobs", require("./routes/aggregatedJobs"));
app.use("/api/subscriptions", require("./routes/subscriptions"));
app.use("/api/verification", require("./routes/verification"));
app.use("/api/admin", require("./routes/admin"));

// ---- Static serving + SPA fallback ----
const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "web", "dist");
const blocked = ["/server/", "/node_modules/", "/data/", "/.git", "/.qodo/", "/package.json", "/package-lock.json", "/web/", "/.env", "/.env."];
const sensitiveFiles = [".env", ".env.local", ".env.production", ".env.development", ".env.example", ".gitignore", ".eslintrc", "tsconfig.json", "vitest.config.js", "render.yaml", "railway.json", "vercel.json"];

app.use((req, res, next) => {
    if (blocked.some((prefix) => req.path.startsWith(prefix))) {
        return res.status(404).json({ error: "Not found" });
    }
    const basename = path.basename(req.path);
    if (sensitiveFiles.includes(basename)) {
        return res.status(404).json({ error: "Not found" });
    }
    next();
});

if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));

    app.use((req, res, next) => {
        const filePath = path.join(distDir, req.path);
        if (!req.path.startsWith("/api") && !fs.existsSync(filePath)) {
            return res.sendFile(path.join(distDir, "index.html"));
        }
        next();
    });
}

// ---- 404 for unknown API routes ----
app.use("/api", (req, res) => {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Not found" } });
});

app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// ---- Error handler (never leaks internals) ----
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
        return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Invalid JSON body." } });
    }
    if (err.status && err.status < 500) {
        return res.status(err.status).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
    }
    console.error(err);
    res.status(500).json({ success: false, error: { code: "INTERNAL", message: "Internal server error." } });
});

module.exports = app;

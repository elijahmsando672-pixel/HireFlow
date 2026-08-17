const jwt = require("jsonwebtoken");
const db = require("./db");
const { JWT_SECRET, ADMIN_EMAIL } = require("./config");
const entitlement = require("./services/entitlement");

function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: "Authentication required." });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
        req.userId = payload.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
}

function requireAdmin(req, res, next) {
    requireAuth(req, res, (err) => {
        if (err) return;
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        const isAdmin = user.role === "admin" || (ADMIN_EMAIL && user.email === ADMIN_EMAIL);
        if (!isAdmin) {
            return res.status(403).json({ error: "Admin access required." });
        }
        next();
    });
}

function subscriptionError() {
    return {
        success: false,
        error: {
            code: "SUBSCRIPTION_REQUIRED",
            message: "A Pro subscription is required for this feature."
        }
    };
}

function requirePlan(plan) {
    const normalizedPlan = String(plan || "").trim().toUpperCase();

    return (req, res, next) => {
        if (!entitlement.isPaywallEnabled()) {
            return next();
        }

        requireAuth(req, res, () => {
            if (req.userId === undefined) return;

            const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
            if (!user) {
                return res.status(404).json({ error: "User not found." });
            }

            if (user.role === "admin") {
                return next();
            }

            if (!entitlement.hasPlan(req.userId, normalizedPlan)) {
                return res.status(402).json(subscriptionError());
            }

            next();
        });
    };
}

function requireSubscription(options = {}) {
    return (req, res, next) => {
        if (!entitlement.isPaywallEnabled()) {
            return next();
        }

        requireAuth(req, res, () => {
            if (req.userId === undefined) return;

            const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
            if (!user) {
                return res.status(404).json({ error: "User not found." });
            }

            if (user.role === "admin") {
                return next();
            }

            if (options.allowJobOwner) {
                const id = parseInt(req.params.id, 10);
                if (id) {
                    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id);
                    if (job && job.posted_by === req.userId) {
                        return next();
                    }
                }
            }

            if (!entitlement.isSubscriptionActive(req.userId)) {
                return res.status(402).json(subscriptionError());
            }

            next();
        });
    };
}

module.exports = { requireAuth, requireAdmin, requirePlan, requireSubscription };

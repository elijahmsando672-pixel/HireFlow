const jwt = require("jsonwebtoken");
const db = require("./db");
const { JWT_SECRET, ADMIN_EMAIL } = require("./config");

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

// Requires an authenticated user with an admin role. Users can only be
// promoted to admin via the database (UPDATE users SET role='admin' ...) or
// by matching ADMIN_EMAIL. Self-registration can never assign admin.
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

module.exports = { requireAuth, requireAdmin };

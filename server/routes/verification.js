const express = require("express");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../middleware");

const router = express.Router();

const VALID_STATUSES = ["pending", "approved", "rejected"];
const VALID_COUNTRIES = [
    "Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia", "Nigeria", "Ghana",
    "South Africa", "Egypt", "Morocco", "Other"
];

function serializeVerification(row) {
    return {
        id: row.id,
        userId: row.user_id,
        companyName: row.company_name,
        companyWebsite: row.company_website,
        companyEmail: row.company_email,
        companyPhone: row.company_phone,
        companyCountry: row.company_country,
        companyDescription: row.company_description,
        businessInfo: row.business_info,
        status: row.status,
        adminNotes: row.admin_notes,
        reviewedBy: row.reviewed_by,
        submittedAt: row.submitted_at,
        reviewedAt: row.reviewed_at
    };
}

// ── Employer: submit verification ──────────────────────────────
router.post("/submit", requireAuth, (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    if (user.role === "admin") {
        return res.status(400).json({ error: "Admin accounts cannot submit verification." });
    }

    const existing = db.prepare(
        "SELECT * FROM employer_verifications WHERE user_id = ? AND status IN ('pending', 'approved')"
    ).get(req.userId);

    if (existing) {
        if (existing.status === "approved") {
            return res.status(400).json({ error: "Your account is already verified." });
        }
        return res.status(400).json({ error: "You already have a pending verification request. Please wait for it to be reviewed." });
    }

    const { companyName, companyWebsite, companyEmail, companyPhone, companyCountry, companyDescription, businessInfo } = req.body;

    if (!companyName || !companyEmail || !companyCountry || !companyDescription) {
        return res.status(400).json({ error: "Company name, email, country, and description are required." });
    }

    if (companyName.trim().length < 2) {
        return res.status(400).json({ error: "Company name must be at least 2 characters." });
    }

    if (companyDescription.trim().length < 20) {
        return res.status(400).json({ error: "Company description must be at least 20 characters." });
    }

    if (!VALID_COUNTRIES.includes(companyCountry)) {
        return res.status(400).json({ error: "Please select a valid country." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(companyEmail.trim())) {
        return res.status(400).json({ error: "Please provide a valid company email." });
    }

    if (companyWebsite && companyWebsite.trim()) {
        try {
            new URL(companyWebsite.trim());
        } catch {
            return res.status(400).json({ error: "Please provide a valid website URL (e.g., https://example.com)." });
        }
    }

    const info = db.prepare(`
        INSERT INTO employer_verifications (user_id, company_name, company_website, company_email, company_phone, company_country, company_description, business_info)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        req.userId,
        companyName.trim(),
        companyWebsite ? companyWebsite.trim() : null,
        companyEmail.trim().toLowerCase(),
        companyPhone ? companyPhone.trim() : null,
        companyCountry,
        companyDescription.trim(),
        businessInfo ? businessInfo.trim() : null
    );

    db.prepare(`
        UPDATE users SET company_name = ?, company_website = ?, company_email = ?, company_phone = ?, company_country = ?, company_description = ?
        WHERE id = ?
    `).run(
        companyName.trim(),
        companyWebsite ? companyWebsite.trim() : null,
        companyEmail.trim().toLowerCase(),
        companyPhone ? companyPhone.trim() : null,
        companyCountry,
        companyDescription.trim(),
        req.userId
    );

    const row = db.prepare("SELECT * FROM employer_verifications WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json({ verification: serializeVerification(row) });
});

// ── Employer: get own verification status ──────────────────────
router.get("/status", requireAuth, (req, res) => {
    const row = db.prepare(
        "SELECT * FROM employer_verifications WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1"
    ).get(req.userId);

    if (!row) {
        return res.json({ verification: null });
    }

    res.json({ verification: serializeVerification(row) });
});

// ── Admin: list all verifications ──────────────────────────────
router.get("/admin/all", requireAdmin, (req, res) => {
    const { status, page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let where = "WHERE 1=1";
    const params = [];

    if (status && VALID_STATUSES.includes(status)) {
        where += " AND v.status = ?";
        params.push(status);
    }

    const countRow = db.prepare(
        `SELECT COUNT(*) AS n FROM employer_verifications v ${where}`
    ).get(...params);

    const rows = db.prepare(`
        SELECT v.*, u.first_name, u.last_name, u.email
        FROM employer_verifications v
        JOIN users u ON u.id = v.user_id
        ${where}
        ORDER BY v.submitted_at DESC
        LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset);

    res.json({
        verifications: rows.map((row) => ({
            ...serializeVerification(row),
            firstName: row.first_name,
            lastName: row.last_name,
            userEmail: row.email
        })),
        total: countRow.n,
        page: pageNum,
        limit: limitNum
    });
});

// ── Admin: get single verification detail ──────────────────────
router.get("/admin/:id", requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) {
        return res.status(404).json({ error: "Verification not found." });
    }

    const row = db.prepare(`
        SELECT v.*, u.first_name, u.last_name, u.email
        FROM employer_verifications v
        JOIN users u ON u.id = v.user_id
        WHERE v.id = ?
    `).get(id);

    if (!row) {
        return res.status(404).json({ error: "Verification not found." });
    }

    res.json({
        verification: {
            ...serializeVerification(row),
            firstName: row.first_name,
            lastName: row.last_name,
            userEmail: row.email
        }
    });
});

// ── Admin: approve verification ────────────────────────────────
router.put("/admin/:id/approve", requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) {
        return res.status(404).json({ error: "Verification not found." });
    }

    const row = db.prepare("SELECT * FROM employer_verifications WHERE id = ?").get(id);
    if (!row) {
        return res.status(404).json({ error: "Verification not found." });
    }

    if (row.status === "approved") {
        return res.status(400).json({ error: "This verification is already approved." });
    }

    const now = new Date().toISOString();

    db.prepare(`
        UPDATE employer_verifications SET status = 'approved', reviewed_by = ?, reviewed_at = ?
        WHERE id = ?
    `).run(req.userId, now, id);

    db.prepare(`
        UPDATE users SET is_verified = 1, verified_at = ?
        WHERE id = ?
    `).run(now, row.user_id);

    const updated = db.prepare("SELECT * FROM employer_verifications WHERE id = ?").get(id);
    res.json({ verification: serializeVerification(updated) });
});

// ── Admin: reject verification ─────────────────────────────────
router.put("/admin/:id/reject", requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id) {
        return res.status(404).json({ error: "Verification not found." });
    }

    const row = db.prepare("SELECT * FROM employer_verifications WHERE id = ?").get(id);
    if (!row) {
        return res.status(404).json({ error: "Verification not found." });
    }

    if (row.status === "rejected") {
        return res.status(400).json({ error: "This verification is already rejected." });
    }

    const { adminNotes } = req.body || {};
    const notes = adminNotes ? String(adminNotes).trim().slice(0, 2000) : null;
    const now = new Date().toISOString();

    db.prepare(`
        UPDATE employer_verifications SET status = 'rejected', admin_notes = ?, reviewed_by = ?, reviewed_at = ?
        WHERE id = ?
    `).run(notes, req.userId, now, id);

    const updated = db.prepare("SELECT * FROM employer_verifications WHERE id = ?").get(id);
    res.json({ verification: serializeVerification(updated) });
});

// ── Admin: get platform stats ──────────────────────────────────
router.get("/admin/stats/overview", requireAdmin, (req, res) => {
    const totalUsers = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
    const totalJobs = db.prepare("SELECT COUNT(*) AS n FROM jobs").get().n;
    const totalApplications = db.prepare("SELECT COUNT(*) AS n FROM applications").get().n;
    const totalContracts = db.prepare("SELECT COUNT(*) AS n FROM contracts").get().n;
    const totalGigs = db.prepare("SELECT COUNT(*) AS n FROM gigs").get().n;

    const byRole = db.prepare(`
        SELECT role, COUNT(*) AS n FROM users GROUP BY role
    `).all();

    const verifiedCount = db.prepare("SELECT COUNT(*) AS n FROM users WHERE is_verified = 1").get().n;
    const pendingVerifications = db.prepare("SELECT COUNT(*) AS n FROM employer_verifications WHERE status = 'pending'").get().n;
    const suspendedCount = db.prepare("SELECT COUNT(*) AS n FROM users WHERE suspended = 1").get().n;

    const roleMap = {};
    byRole.forEach((row) => { roleMap[row.role] = row.n; });

    res.json({
        stats: {
            totalUsers,
            totalJobs,
            totalApplications,
            totalContracts,
            totalGigs,
            verifiedEmployers: verifiedCount,
            pendingVerifications,
            suspendedUsers: suspendedCount,
            usersByRole: roleMap
        }
    });
});

module.exports = router;

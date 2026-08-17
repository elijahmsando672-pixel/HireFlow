const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware");

function safeJsonParse(str, fallback) {
    try { return JSON.parse(str); } catch { return fallback; }
}

const router = express.Router();

router.get("/jobs", requireAuth, (req, res) => {
    const rows = db.prepare(`
        SELECT j.id, j.title, j.company, j.location, j.type, j.category, j.salary, j.posted
        FROM saved_jobs s
        JOIN jobs j ON j.id = s.job_id
        WHERE s.user_id = ?
        ORDER BY s.saved_at DESC
    `).all(req.userId);

    res.json({ jobs: rows });
});

router.post("/jobs", requireAuth, (req, res) => {
    const jobId = parseInt(req.body.jobId, 10);

    if (!jobId) {
        return res.status(400).json({ error: "A job is required." });
    }

    const job = db.prepare("SELECT id FROM jobs WHERE id = ?").get(jobId);

    if (!job) {
        return res.status(404).json({ error: "Job not found." });
    }

    db.prepare("INSERT OR IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)").run(req.userId, jobId);

    res.status(201).json({ saved: true });
});

router.delete("/jobs/:jobId", requireAuth, (req, res) => {
    db.prepare("DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?").run(req.userId, parseInt(req.params.jobId, 10));
    res.json({ saved: false });
});

router.get("/gigs", requireAuth, (req, res) => {
    const rows = db.prepare(`
        SELECT g.id, g.title, g.description, g.category, g.packages,
               u.first_name, u.last_name, u.headline,
               (SELECT AVG(r.rating) FROM reviews r JOIN orders o ON o.id = r.order_id WHERE o.gig_id = g.id) AS avg_rating,
               (SELECT COUNT(*) FROM reviews r JOIN orders o ON o.id = r.order_id WHERE o.gig_id = g.id) AS review_count
        FROM saved_gigs s
        JOIN gigs g ON g.id = s.gig_id
        JOIN users u ON u.id = g.user_id
        WHERE s.user_id = ?
        ORDER BY s.saved_at DESC
    `).all(req.userId);

    res.json({
        gigs: rows.map(function (row) {
            return {
                id: row.id,
                title: row.title,
                description: row.description,
                category: row.category,
                packages: safeJsonParse(row.packages, []),
                seller: {
                    id: row.user_id,
                    firstName: row.first_name,
                    lastName: row.last_name,
                    headline: row.headline
                },
                rating: row.avg_rating ? Math.round(row.avg_rating * 10) / 10 : null,
                reviewCount: row.review_count || 0
            };
        })
    });
});

router.post("/gigs", requireAuth, (req, res) => {
    const gigId = parseInt(req.body.gigId, 10);

    if (!gigId) {
        return res.status(400).json({ error: "A gig is required." });
    }

    const gig = db.prepare("SELECT id FROM gigs WHERE id = ?").get(gigId);

    if (!gig) {
        return res.status(404).json({ error: "Gig not found." });
    }

    db.prepare("INSERT OR IGNORE INTO saved_gigs (user_id, gig_id) VALUES (?, ?)").run(req.userId, gigId);

    res.status(201).json({ saved: true });
});

router.delete("/gigs/:gigId", requireAuth, (req, res) => {
    db.prepare("DELETE FROM saved_gigs WHERE user_id = ? AND gig_id = ?").run(req.userId, parseInt(req.params.gigId, 10));
    res.json({ saved: false });
});

module.exports = router;

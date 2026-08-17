const express = require("express");
const db = require("../db");
const { requireAuth, requirePlan } = require("../middleware");

const router = express.Router();

router.post("/", requireAuth, requirePlan("PRO"), (req, res) => {
    const jobId = parseInt(req.body.jobId, 10);

    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);

    if (!job) {
        return res.status(404).json({ error: "Job not found." });
    }

    const existing = db.prepare("SELECT * FROM applications WHERE user_id = ? AND job_id = ?").get(req.userId, jobId);

    if (existing) {
        return res.status(409).json({ error: "You have already applied to this role." });
    }

    db.prepare(`
        INSERT INTO applications (user_id, job_id, status, applied_at)
        VALUES (?, ?, 'Under Review', ?)
    `).run(req.userId, jobId, new Date().toISOString());

    res.status(201).json({ success: true });
});

router.get("/mine", requireAuth, (req, res) => {
    const rows = db.prepare(`
        SELECT a.id, a.job_id, a.status, a.applied_at, j.title, j.company, j.location
        FROM applications a
        JOIN jobs j ON j.id = a.job_id
        WHERE a.user_id = ?
        ORDER BY a.applied_at DESC
    `).all(req.userId);

    res.json({
        applications: rows.map((row) => ({
            id: row.id,
            jobId: row.job_id,
            title: row.title,
            company: row.company,
            location: row.location,
            status: row.status,
            appliedAt: row.applied_at
        }))
    });
});

module.exports = router;

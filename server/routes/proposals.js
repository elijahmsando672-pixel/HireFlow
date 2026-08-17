const express = require("express");
const { z } = require("zod");
const db = require("../db");
const { requireAuth, requirePlan } = require("../middleware");

const router = express.Router();

const CreateProposalSchema = z.object({
    jobId: z.coerce.number().int().positive().max(2147483647),
    rate: z.coerce.number().int().min(1).max(100000000),
    timelineDays: z.coerce.number().int().min(1).max(3650),
    coverLetter: z.string().trim().min(1).max(10000)
});

router.post("/", requireAuth, requirePlan("PRO"), (req, res) => {
    const parsed = CreateProposalSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { jobId, rate, timelineDays, coverLetter } = parsed.data;

    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);

    if (!job) {
        return res.status(404).json({ error: "Job not found." });
    }

    if (job.posted_by === req.userId) {
        return res.status(400).json({ error: "You cannot propose on your own job." });
    }

    const existing = db.prepare("SELECT * FROM proposals WHERE user_id = ? AND job_id = ?").get(req.userId, jobId);

    if (existing) {
        return res.status(409).json({ error: "You have already submitted a proposal for this job." });
    }

    db.prepare(`
        INSERT INTO proposals (user_id, job_id, cover_letter, rate, timeline_days)
        VALUES (?, ?, ?, ?, ?)
    `).run(req.userId, jobId, coverLetter, rate, timelineDays);

    res.status(201).json({ success: true });
});

router.get("/mine", requireAuth, (req, res) => {
    const rows = db.prepare(`
        SELECT p.id, p.job_id, p.cover_letter, p.rate, p.timeline_days, p.status, p.created_at,
               j.title, j.company, j.location, j.salary
        FROM proposals p
        JOIN jobs j ON j.id = p.job_id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
    `).all(req.userId);

    res.json({
        proposals: rows.map((row) => ({
            id: row.id,
            jobId: row.job_id,
            title: row.title,
            company: row.company,
            location: row.location,
            salary: row.salary,
            coverLetter: row.cover_letter,
            rate: row.rate,
            timelineDays: row.timeline_days,
            status: row.status,
            createdAt: row.created_at
        }))
    });
});

router.put("/:id", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const status = req.body.status;

    if (status !== "Rejected") {
        return res.status(400).json({ error: "Proposals can only be rejected here. Use the hire flow to accept a proposal." });
    }

    const proposal = db.prepare("SELECT * FROM proposals WHERE id = ?").get(id);

    if (!proposal) {
        return res.status(404).json({ error: "Proposal not found." });
    }

    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(proposal.job_id);

    if (!job || job.posted_by !== req.userId) {
        return res.status(403).json({ error: "Only the job poster can update this proposal." });
    }

    if (proposal.status !== "Pending") {
        return res.status(400).json({ error: "Only pending proposals can be rejected." });
    }

    db.prepare("UPDATE proposals SET status = 'Rejected' WHERE id = ?").run(id);

    res.json({ success: true, status: "Rejected" });
});

module.exports = router;

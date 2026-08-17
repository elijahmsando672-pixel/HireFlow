const express = require("express");
const db = require("../db");
const { requireAuth, requireSubscription } = require("../middleware");

const router = express.Router();

function serializeJob(row) {
    return {
        id: row.id,
        title: row.title,
        company: row.company,
        location: row.location,
        type: row.type,
        category: row.category,
        salary: row.salary,
        description: row.description,
        requirements: row.requirements ? JSON.parse(row.requirements) : [],
        posted: row.posted,
        postedBy: row.posted_by || null,
        proposalCount: row.proposal_count || 0
    };
}

router.get("/", requireSubscription(), (req, res) => {
    const { search, category, location, type, sort } = req.query;

    let sql = `
        SELECT j.*, (SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.id) AS proposal_count
        FROM jobs j WHERE 1 = 1
    `;
    const params = [];

    if (search) {
        sql += " AND (j.title LIKE ? OR j.company LIKE ? OR j.description LIKE ? OR j.requirements LIKE ?)";
        const like = "%" + search + "%";
        params.push(like, like, like, like);
    }

    if (category) {
        sql += " AND j.category = ?";
        params.push(category);
    }

    if (location) {
        sql += " AND j.location = ?";
        params.push(location);
    }

    if (type) {
        sql += " AND j.type = ?";
        params.push(type);
    }

    sql += sort === "salary" ? " ORDER BY j.salary DESC" : " ORDER BY j.posted DESC";

    const rows = db.prepare(sql).all(...params);
    res.json({ jobs: rows.map(serializeJob) });
});

router.post("/", requireAuth, (req, res) => {
    const { title, company, location, type, category, salary, description, requirements } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: "Please provide at least a title and description." });
    }

    let requirementList = [];
    if (Array.isArray(requirements)) {
        requirementList = requirements.filter(Boolean);
    } else if (typeof requirements === "string" && requirements.trim()) {
        requirementList = requirements.split("\n").map((line) => line.trim()).filter(Boolean);
    }

    const info = db.prepare(`
        INSERT INTO jobs (title, company, location, type, category, salary, description, requirements, posted, posted_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        title.trim(),
        (company || "Your company").trim(),
        (location || "Remote").trim(),
        (type || "Contract").trim(),
        (category || "Software").trim(),
        Math.max(0, parseInt(salary, 10) || 0),
        description.trim(),
        JSON.stringify(requirementList),
        new Date().toISOString().slice(0, 10),
        req.userId
    );

    const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json({ job: serializeJob(row) });
});

router.get("/mine", requireAuth, (req, res) => {
    const rows = db.prepare(`
        SELECT j.*, (SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.id) AS proposal_count
        FROM jobs j
        WHERE j.posted_by = ?
        ORDER BY j.posted DESC
    `).all(req.userId);

    res.json({ jobs: rows.map(serializeJob) });
});

router.get("/:id/proposals", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (!id) {
        return res.status(404).json({ error: "Job not found." });
    }

    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id);

    if (!job) {
        return res.status(404).json({ error: "Job not found." });
    }

    const rows = db.prepare(`
        SELECT p.id, p.user_id, p.cover_letter, p.rate, p.timeline_days, p.status, p.created_at,
               u.first_name, u.last_name, u.headline, u.skills
        FROM proposals p
        JOIN users u ON u.id = p.user_id
        WHERE p.job_id = ?
        ORDER BY p.created_at DESC
    `).all(id);

    res.json({
        proposals: rows.map((row) => ({
            id: row.id,
            userId: row.user_id,
            firstName: row.first_name,
            lastName: row.last_name,
            headline: row.headline,
            skills: row.skills ? JSON.parse(row.skills) : [],
            coverLetter: row.cover_letter,
            rate: row.rate,
            timelineDays: row.timeline_days,
            status: row.status,
            createdAt: row.created_at
        }))
    });
});

router.get("/:id", requireSubscription({ allowJobOwner: true }), (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (!id) {
        return res.status(404).json({ error: "Job not found." });
    }

    const row = db.prepare(`
        SELECT j.*, (SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.id) AS proposal_count
        FROM jobs j WHERE j.id = ?
    `).get(id);

    if (!row) {
        return res.status(404).json({ error: "Job not found." });
    }

    res.json({ job: serializeJob(row) });
});

module.exports = router;

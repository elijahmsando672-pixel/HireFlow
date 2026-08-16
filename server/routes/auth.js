const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { JWT_SECRET, SALT_ROUNDS } = require("../config");
const { requireAuth } = require("../middleware");

const router = express.Router();

function serializeUser(row) {
    return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.username,
        email: row.email,
        phone: row.phone,
        role: row.role || "both",
        headline: row.headline,
        bio: row.bio,
        education: row.education,
        skills: row.skills ? JSON.parse(row.skills) : [],
        interests: row.interests ? JSON.parse(row.interests) : [],
        linkedin: row.linkedin,
        github: row.github,
        twitter: row.twitter,
        portfolio: row.portfolio,
        createdAt: row.created_at
    };
}

function normalizeRole(role) {
    const value = String(role || "").trim().toLowerCase();
    return ["client", "freelancer", "both"].includes(value) ? value : "both";
}

function signToken(user) {
    return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", (req, res) => {
    const { firstName, lastName, username, email, phone, password } = req.body;
    const role = normalizeRole(req.body.role);

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "Please fill in all required fields." });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
    const normalizedEmail = email.trim().toLowerCase();

    try {
        const info = db.prepare(`
            INSERT INTO users (first_name, last_name, username, email, phone, password_hash, role)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            firstName.trim(),
            lastName.trim(),
            username ? username.trim() : null,
            normalizedEmail,
            phone ? phone.trim() : null,
            passwordHash,
            role
        );

        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
        const token = signToken(user);

        res.status(201).json({ token, user: serializeUser(user) });
    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(409).json({ error: "An account with that email or username already exists." });
        }
        throw error;
    }
});

router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Please fill in all fields." });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user);
    res.json({ token, user: serializeUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);

    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    res.json({ user: serializeUser(user) });
});

router.put("/profile", requireAuth, (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);

    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    const body = req.body || {};

    const pick = (key, dbField, fallback) => {
        return body[key] !== undefined ? body[key] : fallback;
    };

    const skills = body.skills !== undefined ? JSON.stringify(body.skills || []) : user.skills;
    const interests = body.interests !== undefined ? JSON.stringify(body.interests || []) : user.interests;

    db.prepare(`
        UPDATE users SET
            first_name = ?, last_name = ?, email = ?, phone = ?, role = ?,
            headline = ?, bio = ?, education = ?,
            skills = ?, interests = ?,
            linkedin = ?, github = ?, twitter = ?, portfolio = ?
        WHERE id = ?
    `).run(
        pick("firstName", "first_name", user.first_name),
        pick("lastName", "last_name", user.last_name),
        pick("email", "email", user.email),
        pick("phone", "phone", user.phone),
        normalizeRole(body.role !== undefined ? body.role : user.role),
        pick("headline", "headline", user.headline),
        pick("bio", "bio", user.bio),
        pick("education", "education", user.education),
        skills,
        interests,
        pick("linkedin", "linkedin", user.linkedin),
        pick("github", "github", user.github),
        pick("twitter", "twitter", user.twitter),
        pick("portfolio", "portfolio", user.portfolio),
        req.userId
    );

    const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    res.json({ user: serializeUser(updated) });
});

module.exports = router;

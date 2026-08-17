const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware");

const router = express.Router();

router.post("/", requireAuth, (req, res) => {
    const recipientId = parseInt(req.body.recipientId, 10);
    const body = (req.body.body || "").trim();

    if (!recipientId || !body) {
        return res.status(400).json({ error: "Message body and recipient are required." });
    }

    if (body.length > 5000) {
        return res.status(400).json({ error: "Message must be 5000 characters or fewer." });
    }

    if (recipientId === req.userId) {
        return res.status(400).json({ error: "You cannot message yourself." });
    }

    const recipient = db.prepare("SELECT id FROM users WHERE id = ?").get(recipientId);

    if (!recipient) {
        return res.status(404).json({ error: "User not found." });
    }

    db.prepare(`
        INSERT INTO messages (sender_id, recipient_id, body)
        VALUES (?, ?, ?)
    `).run(req.userId, recipientId, body);

    res.status(201).json({ success: true });
});

router.get("/conversations", requireAuth, (req, res) => {
    const rows = db.prepare(`
        SELECT u.id, u.first_name, u.last_name,
            (SELECT m.body FROM messages m
             WHERE (m.sender_id = u.id AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = u.id)
             ORDER BY m.created_at DESC LIMIT 1) AS last_message,
            (SELECT m.created_at FROM messages m
             WHERE (m.sender_id = u.id AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = u.id)
             ORDER BY m.created_at DESC LIMIT 1) AS last_at,
            (SELECT COUNT(*) FROM messages m WHERE m.sender_id = u.id AND m.recipient_id = ? AND m.read = 0) AS unread
        FROM users u
        WHERE u.id IN (
            SELECT CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END
            FROM messages WHERE sender_id = ? OR recipient_id = ?
        )
        ORDER BY last_at DESC
    `).all(req.userId, req.userId, req.userId, req.userId, req.userId, req.userId, req.userId, req.userId);

    res.json({
        conversations: rows.map(function (row) {
            return {
                userId: row.id,
                firstName: row.first_name,
                lastName: row.last_name,
                lastMessage: row.last_message,
                lastAt: row.last_at,
                unread: row.unread
            };
        })
    });
});

router.get("/:userId", requireAuth, (req, res) => {
    const userId = parseInt(req.params.userId, 10);

    if (!userId) {
        return res.status(404).json({ error: "User not found." });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const before = req.query.before ? parseInt(req.query.before, 10) : null;

    db.prepare(`
        UPDATE messages SET read = 1
        WHERE sender_id = ? AND recipient_id = ? AND read = 0
    `).run(userId, req.userId);

    let sql = `
        SELECT m.*, u.first_name, u.last_name
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE (m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?)
    `;
    const params = [req.userId, userId, userId, req.userId];

    if (before) {
        sql += " AND m.id < ?";
        params.push(before);
    }

    sql += " ORDER BY m.created_at DESC LIMIT ?";
    params.push(limit);

    const rows = db.prepare(sql).all(...params);
    rows.reverse();

    res.json({
        messages: rows.map(function (row) {
            return {
                id: row.id,
                senderId: row.sender_id,
                recipientId: row.recipient_id,
                firstName: row.first_name,
                lastName: row.last_name,
                body: row.body,
                createdAt: row.created_at
            };
        })
    });
});

module.exports = router;

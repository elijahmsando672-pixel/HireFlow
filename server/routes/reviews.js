const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware");

const router = express.Router();

router.post("/", requireAuth, (req, res) => {
    const orderId = parseInt(req.body.orderId, 10);
    const rating = parseInt(req.body.rating, 10);
    const comment = (req.body.comment || "").trim();

    if (!orderId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Please provide a rating between 1 and 5." });
    }

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);

    if (!order) {
        return res.status(404).json({ error: "Order not found." });
    }

    if (order.buyer_id !== req.userId && order.seller_id !== req.userId) {
        return res.status(403).json({ error: "You are not part of this order." });
    }

    if (order.status !== "Completed") {
        return res.status(400).json({ error: "You can only review completed orders." });
    }

    const recipientId = order.buyer_id === req.userId ? order.seller_id : order.buyer_id;

    const existing = db.prepare("SELECT * FROM reviews WHERE order_id = ? AND from_user_id = ?").get(orderId, req.userId);

    if (existing) {
        return res.status(409).json({ error: "You have already reviewed this order." });
    }

    db.prepare(`
        INSERT INTO reviews (order_id, from_user_id, to_user_id, rating, comment)
        VALUES (?, ?, ?, ?, ?)
    `).run(orderId, req.userId, recipientId, rating, comment);

    res.status(201).json({ success: true });
});

module.exports = router;

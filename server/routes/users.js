const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (!id) {
        return res.status(404).json({ error: "User not found." });
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    const ratingRow = db.prepare(`
        SELECT AVG(rating) AS avg_rating, COUNT(*) AS n FROM reviews WHERE to_user_id = ?
    `).get(id);

    res.json({
        user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role || "both",
            headline: user.headline,
            bio: user.bio,
            skills: user.skills ? JSON.parse(user.skills) : [],
            github: user.github,
            linkedin: user.linkedin,
            twitter: user.twitter,
            portfolio: user.portfolio,
            rating: ratingRow.avg_rating ? Math.round(ratingRow.avg_rating * 10) / 10 : null,
            reviewCount: ratingRow.n || 0
        }
    });
});

module.exports = router;

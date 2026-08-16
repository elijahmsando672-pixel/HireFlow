const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware");

const router = express.Router();

function serializeGig(row) {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        category: row.category,
        packages: JSON.parse(row.packages),
        createdAt: row.created_at,
        seller: {
            id: row.user_id,
            firstName: row.first_name,
            lastName: row.last_name,
            headline: row.headline
        },
        rating: row.avg_rating ? Math.round(row.avg_rating * 10) / 10 : null,
        reviewCount: row.review_count || 0,
        orderCount: row.order_count || 0
    };
}

router.get("/", requireAuth, (req, res) => {
    const { search, category, sort } = req.query;

    let sql = `
        SELECT g.*, u.first_name, u.last_name, u.headline,
               (SELECT AVG(r.rating) FROM reviews r JOIN orders o ON o.id = r.order_id WHERE o.gig_id = g.id) AS avg_rating,
               (SELECT COUNT(*) FROM reviews r JOIN orders o ON o.id = r.order_id WHERE o.gig_id = g.id) AS review_count,
               (SELECT COUNT(*) FROM orders o WHERE o.gig_id = g.id) AS order_count
        FROM gigs g
        JOIN users u ON u.id = g.user_id
        WHERE 1 = 1
    `;
    const params = [];

    if (search) {
        sql += " AND (g.title LIKE ? OR g.description LIKE ?)";
        const like = "%" + search + "%";
        params.push(like, like);
    }

    if (category) {
        sql += " AND g.category = ?";
        params.push(category);
    }

    if (sort === "priceLow") {
        sql += " ORDER BY CAST(json_extract(g.packages, '$[0].price') AS INTEGER) ASC";
    } else if (sort === "priceHigh") {
        sql += " ORDER BY CAST(json_extract(g.packages, '$[0].price') AS INTEGER) DESC";
    } else {
        sql += " ORDER BY g.created_at DESC";
    }

    const rows = db.prepare(sql).all(...params);
    res.json({ gigs: rows.map(serializeGig) });
});

router.post("/", requireAuth, (req, res) => {
    const title = (req.body.title || "").trim();
    const description = (req.body.description || "").trim();
    const category = (req.body.category || "Software").trim();
    let packages = req.body.packages;

    if (!title || !description) {
        return res.status(400).json({ error: "Please provide a title and description for your gig." });
    }

    if (!Array.isArray(packages) || packages.length === 0) {
        return res.status(400).json({ error: "Add at least one package to your gig." });
    }

    packages = packages.map(function (pkg) {
        return {
            name: (pkg.name || "Basic").trim(),
            price: Math.max(0, parseInt(pkg.price, 10) || 0),
            description: (pkg.description || "").trim(),
            deliveryDays: Math.max(1, parseInt(pkg.deliveryDays, 10) || 1)
        };
    });

    const info = db.prepare(`
        INSERT INTO gigs (user_id, title, description, category, packages)
        VALUES (?, ?, ?, ?, ?)
    `).run(req.userId, title, description, category, JSON.stringify(packages));

    const row = db.prepare(`
        SELECT g.*, u.first_name, u.last_name, u.headline, NULL AS avg_rating, 0 AS review_count, 0 AS order_count
        FROM gigs g JOIN users u ON u.id = g.user_id WHERE g.id = ?
    `).get(info.lastInsertRowid);

    res.status(201).json({ gig: serializeGig(row) });
});

router.get("/mine", requireAuth, (req, res) => {
    const rows = db.prepare(`
        SELECT g.*, u.first_name, u.last_name, u.headline,
               (SELECT AVG(r.rating) FROM reviews r JOIN orders o ON o.id = r.order_id WHERE o.gig_id = g.id) AS avg_rating,
               (SELECT COUNT(*) FROM reviews r JOIN orders o ON o.id = r.order_id WHERE o.gig_id = g.id) AS review_count,
               (SELECT COUNT(*) FROM orders o WHERE o.gig_id = g.id) AS order_count
        FROM gigs g JOIN users u ON u.id = g.user_id
        WHERE g.user_id = ?
        ORDER BY g.created_at DESC
    `).all(req.userId);

    res.json({ gigs: rows.map(serializeGig) });
});

router.get("/:id", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (!id) {
        return res.status(404).json({ error: "Gig not found." });
    }

    const row = db.prepare(`
        SELECT g.*, u.first_name, u.last_name, u.headline, u.bio, u.skills,
               (SELECT AVG(r.rating) FROM reviews r JOIN orders o ON o.id = r.order_id WHERE o.gig_id = g.id) AS avg_rating,
               (SELECT COUNT(*) FROM reviews r JOIN orders o ON o.id = r.order_id WHERE o.gig_id = g.id) AS review_count,
               (SELECT COUNT(*) FROM orders o WHERE o.gig_id = g.id) AS order_count
        FROM gigs g JOIN users u ON u.id = g.user_id
        WHERE g.id = ?
    `).get(id);

    if (!row) {
        return res.status(404).json({ error: "Gig not found." });
    }

    const reviews = db.prepare(`
        SELECT r.id, r.rating, r.comment, r.created_at, u.first_name, u.last_name
        FROM reviews r
        JOIN orders o ON o.id = r.order_id
        JOIN users u ON u.id = r.from_user_id
        WHERE o.gig_id = ?
        ORDER BY r.created_at DESC
    `).all(id);

    res.json({
        gig: serializeGig(row),
        reviews: reviews.map((review) => ({
            id: review.id,
            firstName: review.first_name,
            lastName: review.last_name,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.created_at
        }))
    });
});

module.exports = router;

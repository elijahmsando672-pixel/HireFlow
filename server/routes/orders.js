const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware");

const router = express.Router();

function serializeOrder(row) {
    return {
        id: row.id,
        gigId: row.gig_id,
        gigTitle: row.gig_title,
        packageName: row.package_name,
        price: row.price,
        status: row.status,
        orderedAt: row.ordered_at,
        completedAt: row.completed_at,
        buyer: {
            id: row.buyer_id,
            firstName: row.buyer_first_name,
            lastName: row.buyer_last_name
        },
        seller: {
            id: row.seller_id,
            firstName: row.seller_first_name,
            lastName: row.seller_last_name
        },
        reviewed: !!row.reviewed,
        contractId: row.contract_id || null
    };
}

const ORDER_SELECT = `
    SELECT o.*, g.title AS gig_title,
           b.first_name AS buyer_first_name, b.last_name AS buyer_last_name,
           s.first_name AS seller_first_name, s.last_name AS seller_last_name,
           c.id AS contract_id,
           EXISTS(SELECT 1 FROM reviews r WHERE r.order_id = o.id AND r.from_user_id = ?) AS reviewed
    FROM orders o
    JOIN gigs g ON g.id = o.gig_id
    JOIN users b ON b.id = o.buyer_id
    JOIN users s ON s.id = o.seller_id
    LEFT JOIN contracts c ON c.order_id = o.id
`;

function createContractForOrder(orderId, buyerId, sellerId, title, amount) {
    db.prepare(`
        INSERT INTO contracts (type, client_id, freelancer_id, title, amount, order_id, terms)
        VALUES ('gig', ?, ?, ?, ?, ?, ?)
    `).run(
        buyerId,
        sellerId,
        title,
        amount,
        orderId,
        "Fixed-price gig order fulfilled in one delivery."
    );
}

router.post("/", requireAuth, (req, res) => {
    const gigId = parseInt(req.body.gigId, 10);
    const packageName = (req.body.packageName || "").trim();

    if (!gigId || !packageName) {
        return res.status(400).json({ error: "Please select a package." });
    }

    const gig = db.prepare("SELECT * FROM gigs WHERE id = ?").get(gigId);

    if (!gig) {
        return res.status(404).json({ error: "Gig not found." });
    }

    if (gig.user_id === req.userId) {
        return res.status(400).json({ error: "You cannot order your own gig." });
    }

    let packages = [];
    try {
        packages = JSON.parse(gig.packages);
    } catch (error) {
        packages = [];
    }

    const selected = packages.find(function (pkg) {
        return pkg.name === packageName;
    });

    if (!selected) {
        return res.status(400).json({ error: "That package was not found on this gig." });
    }

    const createOrder = db.transaction(() => {
        const info = db.prepare(`
            INSERT INTO orders (gig_id, buyer_id, seller_id, package_name, price)
            VALUES (?, ?, ?, ?, ?)
        `).run(gigId, req.userId, gig.user_id, packageName, selected.price);

        createContractForOrder(info.lastInsertRowid, req.userId, gig.user_id, gig.title, selected.price);
        return info.lastInsertRowid;
    });

    const orderId = createOrder();

    const row = db.prepare(ORDER_SELECT + " WHERE o.id = ?").get(req.userId, orderId);

    res.status(201).json({ order: serializeOrder(row) });
});

router.get("/mine", requireAuth, (req, res) => {
    const buyerRows = db.prepare(ORDER_SELECT + " WHERE o.buyer_id = ? ORDER BY o.ordered_at DESC").all(req.userId, req.userId);
    const sellerRows = db.prepare(ORDER_SELECT + " WHERE o.seller_id = ? ORDER BY o.ordered_at DESC").all(req.userId, req.userId);

    res.json({
        buyer: buyerRows.map(serializeOrder),
        seller: sellerRows.map(serializeOrder)
    });
});

module.exports = router;

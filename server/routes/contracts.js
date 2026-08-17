const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware");

const router = express.Router();

const CONTRACT_STATUSES = ["Active", "Paid", "Delivered", "Completed", "Cancelled"];
const PAYMENT_METHODS = ["M-Pesa", "Card", "Bank"];

const CONTRACT_SELECT = `
    SELECT c.*,
           cl.first_name AS client_first_name, cl.last_name AS client_last_name, cl.headline AS client_headline,
           fr.first_name AS freelancer_first_name, fr.last_name AS freelancer_last_name, fr.headline AS freelancer_headline,
           p.id AS payment_id, p.amount AS payment_amount, p.method AS payment_method,
           p.reference AS payment_reference, p.status AS payment_status, p.paid_at AS payment_paid_at
    FROM contracts c
    JOIN users cl ON cl.id = c.client_id
    JOIN users fr ON fr.id = c.freelancer_id
    LEFT JOIN payments p ON p.id = (SELECT id FROM payments WHERE contract_id = c.id ORDER BY id DESC LIMIT 1)
`;

function serializeContract(row) {
    return {
        id: row.id,
        type: row.type,
        clientId: row.client_id,
        freelancerId: row.freelancer_id,
        client: {
            id: row.client_id,
            firstName: row.client_first_name,
            lastName: row.client_last_name,
            headline: row.client_headline
        },
        freelancer: {
            id: row.freelancer_id,
            firstName: row.freelancer_first_name,
            lastName: row.freelancer_last_name,
            headline: row.freelancer_headline
        },
        title: row.title,
        amount: row.amount,
        proposalId: row.proposal_id || null,
        orderId: row.order_id || null,
        status: row.status,
        terms: row.terms,
        deliveryNote: row.delivery_note,
        createdAt: row.created_at,
        startedAt: row.started_at,
        deliveredAt: row.delivered_at,
        completedAt: row.completed_at,
        payment: row.payment_id
            ? {
                  id: row.payment_id,
                  amount: row.payment_amount,
                  method: row.payment_method,
                  reference: row.payment_reference,
                  status: row.payment_status,
                  paidAt: row.payment_paid_at
              }
            : null
    };
}

function getContract(id) {
    return db.prepare(CONTRACT_SELECT + " WHERE c.id = ?").get(id);
}

function findProposalJob(proposalId) {
    return db.prepare(`
        SELECT p.*, j.title, j.posted_by
        FROM proposals p
        JOIN jobs j ON j.id = p.job_id
        WHERE p.id = ?
    `).get(proposalId);
}

router.post("/", requireAuth, (req, res) => {
    const proposalId = parseInt(req.body.proposalId, 10);

    if (!proposalId) {
        return res.status(400).json({ error: "Please select a proposal to hire." });
    }

    const proposal = db.prepare("SELECT * FROM proposals WHERE id = ?").get(proposalId);

    if (!proposal) {
        return res.status(404).json({ error: "Proposal not found." });
    }

    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(proposal.job_id);

    if (!job || job.posted_by !== req.userId) {
        return res.status(403).json({ error: "Only the job poster can hire a freelancer." });
    }

    if (proposal.status !== "Pending") {
        return res.status(400).json({ error: "This proposal has already been reviewed." });
    }

    const existing = db.prepare("SELECT * FROM contracts WHERE proposal_id = ?").get(proposalId);

    if (existing) {
        return res.status(409).json({ error: "A contract already exists for this proposal." });
    }

    const hire = db.transaction(() => {
        const info = db.prepare(`
            INSERT INTO contracts (type, client_id, freelancer_id, title, amount, proposal_id, terms)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            "job",
            req.userId,
            proposal.user_id,
            job.title,
            proposal.rate,
            proposalId,
            "Delivery in " + proposal.timeline_days + " days for " + proposal.rate
        );

        db.prepare("UPDATE proposals SET status = 'Accepted' WHERE id = ?").run(proposalId);
        db.prepare("UPDATE proposals SET status = 'Rejected' WHERE job_id = ? AND status = 'Pending' AND id != ?")
            .run(proposal.job_id, proposalId);
        return info.lastInsertRowid;
    });

    const contractId = hire();

    res.status(201).json({ contract: serializeContract(getContract(contractId)) });
});

router.get("/", requireAuth, (req, res) => {
    const rows = db.prepare(CONTRACT_SELECT + " WHERE c.client_id = ? OR c.freelancer_id = ? ORDER BY c.created_at DESC")
        .all(req.userId, req.userId);

    res.json({ contracts: rows.map(serializeContract) });
});

router.get("/:id", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const row = getContract(id);

    if (!row) {
        return res.status(404).json({ error: "Contract not found." });
    }

    if (row.client_id !== req.userId && row.freelancer_id !== req.userId) {
        return res.status(403).json({ error: "You are not part of this contract." });
    }

    res.json({ contract: serializeContract(row) });
});

router.post("/:id/pay", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const method = PAYMENT_METHODS.includes(req.body.method) ? req.body.method : "M-Pesa";
    const reference = (req.body.reference || "").trim();

    const row = getContract(id);

    if (!row) {
        return res.status(404).json({ error: "Contract not found." });
    }

    if (row.client_id !== req.userId) {
        return res.status(403).json({ error: "Only the client can pay for this contract." });
    }

    if (row.status !== "Active") {
        return res.status(400).json({ error: "This contract can only be paid while active." });
    }

    if (row.payment_id) {
        return res.status(409).json({ error: "This contract has already been paid." });
    }

    const now = new Date().toISOString();

    const recordPayment = db.transaction(() => {
        const info = db.prepare(`
            INSERT INTO payments (contract_id, amount, method, reference, status, paid_at)
            VALUES (?, ?, ?, ?, 'Paid', ?)
        `).run(id, row.amount, method, reference || null, now);

        db.prepare("UPDATE contracts SET status = 'Paid', started_at = ? WHERE id = ?").run(now, id);
        return info.lastInsertRowid;
    });

    const paymentId = recordPayment();

    res.json({ contract: serializeContract(getContract(id)), paymentId });
});

router.post("/:id/deliver", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const deliveryNote = (req.body.deliveryNote || "").trim();

    const row = getContract(id);

    if (!row) {
        return res.status(404).json({ error: "Contract not found." });
    }

    if (row.freelancer_id !== req.userId) {
        return res.status(403).json({ error: "Only the freelancer can deliver on this contract." });
    }

    if (row.status !== "Paid") {
        return res.status(400).json({ error: "The contract must be paid before delivery." });
    }

    const now = new Date().toISOString();

    db.prepare("UPDATE contracts SET status = 'Delivered', delivery_note = ?, delivered_at = ? WHERE id = ?")
        .run(deliveryNote || "Delivered", now, id);

    res.json({ contract: serializeContract(getContract(id)) });
});

router.post("/:id/complete", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const row = getContract(id);

    if (!row) {
        return res.status(404).json({ error: "Contract not found." });
    }

    if (row.client_id !== req.userId) {
        return res.status(403).json({ error: "Only the client can accept and complete this contract." });
    }

    if (row.status !== "Delivered") {
        return res.status(400).json({ error: "You can only complete a delivered contract." });
    }

    const now = new Date().toISOString();

    db.transaction(() => {
        db.prepare("UPDATE contracts SET status = 'Completed', completed_at = ? WHERE id = ?").run(now, id);

        if (row.order_id) {
            db.prepare("UPDATE orders SET status = 'Completed', completed_at = ? WHERE id = ? AND status != 'Completed'")
                .run(now, row.order_id);
        }
    })();

    res.json({ contract: serializeContract(getContract(id)) });
});

router.post("/:id/cancel", requireAuth, (req, res) => {
    const id = parseInt(req.params.id, 10);
    const row = getContract(id);

    if (!row) {
        return res.status(404).json({ error: "Contract not found." });
    }

    if (row.client_id !== req.userId && row.freelancer_id !== req.userId) {
        return res.status(403).json({ error: "You are not part of this contract." });
    }

    if (["Completed", "Cancelled"].includes(row.status)) {
        return res.status(400).json({ error: "This contract can no longer be cancelled." });
    }

    if (row.status === "Paid" && row.freelancer_id === req.userId) {
        return res.status(403).json({ error: "Only the client can cancel a paid contract." });
    }

    db.transaction(() => {
        db.prepare("UPDATE contracts SET status = 'Cancelled' WHERE id = ?").run(id);

        if (row.order_id) {
            db.prepare("UPDATE orders SET status = 'Cancelled' WHERE id = ? AND status NOT IN ('Completed', 'Cancelled')")
                .run(row.order_id);
        }

        if (row.proposal_id) {
            db.prepare("UPDATE proposals SET status = 'Rejected' WHERE id = ? AND status = 'Accepted'").run(row.proposal_id);
        }
    })();

    res.json({ contract: serializeContract(getContract(id)) });
});

module.exports = router;

const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware");
const {
    SUBSCRIPTION_ENABLED,
    SUBSCRIPTION_PRICE_KES,
    SUBSCRIPTION_CURRENCY,
    SUBSCRIPTION_DURATION_DAYS,
    SUBSCRIPTION_PRO_PLAN,
    FRONTEND_URL
} = require("../config");
const payments = require("../payments");
const subscriptionService = require("../services/subscription");
const entitlement = require("../services/entitlement");

const router = express.Router();

function serializeSubscription(row) {
    if (!row) return null;
    return {
        id: row.id,
        plan: row.plan,
        status: row.status,
        provider: row.provider,
        providerSubscriptionId: row.provider_subscription_id,
        providerTransactionId: row.provider_transaction_id,
        amount: row.amount,
        currency: row.currency,
        startedAt: row.started_at,
        expiresAt: row.expires_at,
        cancelledAt: row.cancelled_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

router.get("/status", requireAuth, (req, res) => {
    const subscription = entitlement.getActiveSubscription(req.userId) || null;
    const plan = subscription ? subscription.plan : "FREE";
    const status = subscription ? subscription.status : "NONE";

    res.json({
        success: true,
        data: {
            plan: plan,
            status: status,
            isActive: !!subscription,
            expiresAt: subscription ? subscription.expires_at : null
        }
    });
});

router.get("/me", requireAuth, (req, res) => {
    const rows = db.prepare(`
        SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC
    `).all(req.userId);

    res.json({ success: true, data: { subscriptions: rows.map(serializeSubscription) } });
});

router.post("/checkout", requireAuth, async (req, res) => {
    if (!SUBSCRIPTION_ENABLED) {
        return res.status(400).json({ success: false, error: { code: "SUBSCRIPTIONS_DISABLED", message: "Subscriptions are currently disabled." } });
    }

    const active = entitlement.getActiveSubscription(req.userId);
    if (active) {
        return res.json({
            success: true,
            data: {
                subscription: serializeSubscription(active),
                alreadyActive: true
            }
        });
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
    if (!user) {
        return res.status(404).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found." } });
    }

    const reference = "HF-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);

    try {
        const subscription = subscriptionService.createSubscription(req.userId, {
            plan: SUBSCRIPTION_PRO_PLAN,
            status: "PENDING",
            provider: payments.getProvider().name || "MOCK",
            amount: SUBSCRIPTION_PRICE_KES,
            currency: SUBSCRIPTION_CURRENCY
        });

        const provider = payments.getProvider();
        const result = await provider.createCheckout({
            reference,
            amount: SUBSCRIPTION_PRICE_KES,
            currency: SUBSCRIPTION_CURRENCY,
            description: `HireFlow ${SUBSCRIPTION_PRO_PLAN} subscription (${SUBSCRIPTION_DURATION_DAYS} days)`,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone
        });

        const updated = subscriptionService.updateSubscription(subscription.id, {
            providerSubscriptionId: result.orderTrackingId,
            providerTransactionId: reference
        });

        res.json({
            success: true,
            data: {
                subscription: serializeSubscription(updated),
                checkoutUrl: result.redirectUrl,
                orderTrackingId: result.orderTrackingId,
                mock: result.mock
            }
        });
    } catch (error) {
        console.error("Subscription checkout error:", error.message);
        res.status(502).json({ success: false, error: { code: "PAYMENT_PROVIDER_ERROR", message: "Payment provider error. Please try again." } });
    }
});

router.get("/callback", async (req, res) => {
    const trackingId = req.query.order_tracking_id;

    if (!trackingId || typeof trackingId !== "string" || !trackingId.startsWith("HF-")) {
        return res.redirect(FRONTEND_URL + "/upgrade?status=error");
    }

    try {
        const provider = payments.getProvider();
        const result = provider.processCallback(req.query);

        if (!result.orderTrackingId || result.orderTrackingId !== trackingId) {
            return res.redirect(FRONTEND_URL + "/upgrade?status=error");
        }

        const subscription = subscriptionService.findSubscriptionByProviderTransactionId(result.orderTrackingId);
        if (!subscription) {
            return res.redirect(FRONTEND_URL + "/upgrade?status=error");
        }

        const ok = result.status === "SUCCESS" || result.status === "COMPLETED" || result.status === "PESAPAL_PARTIAL_REFUNDS";
        const newStatus = ok ? "ACTIVE" : "FAILED";

        if (subscription.status !== newStatus) {
            const updates = { status: newStatus };
            if (ok) {
                updates.startedAt = new Date().toISOString();
                updates.expiresAt = new Date(Date.now() + SUBSCRIPTION_DURATION_DAYS * 86400000).toISOString();
            }
            subscriptionService.updateSubscription(subscription.id, updates);
        }

        res.redirect(FRONTEND_URL + "/upgrade?status=" + encodeURIComponent(result.status));
    } catch (error) {
        res.redirect(FRONTEND_URL + "/upgrade?status=error");
    }
});

router.post("/ipn", async (req, res) => {
    const body = req.body || {};

    if (!body.order_tracking_id || typeof body.order_tracking_id !== "string" || !body.order_tracking_id.startsWith("HF-")) {
        return res.status(200).send("OK");
    }

    const provider = payments.getProvider();
    const result = provider.processIPN(body);

    if (!result.orderTrackingId || result.orderTrackingId !== body.order_tracking_id) {
        return res.status(200).send("OK");
    }

    try {
        const subscription = subscriptionService.findSubscriptionByProviderTransactionId(result.orderTrackingId);
        if (!subscription) {
            return res.status(200).send("OK");
        }

        if (subscription.status === "ACTIVE" || subscription.status === "CANCELLED") {
            return res.status(200).send("OK");
        }

        const ok = result.status === "SUCCESS" || result.status === "COMPLETED" || result.status === "PESAPAL_PARTIAL_REFUNDS";
        const newStatus = ok ? "ACTIVE" : "FAILED";

        const updates = { status: newStatus };
        if (ok) {
            updates.startedAt = new Date().toISOString();
            updates.expiresAt = new Date(Date.now() + SUBSCRIPTION_DURATION_DAYS * 86400000).toISOString();
        }
        subscriptionService.updateSubscription(subscription.id, updates);

        res.status(200).send("OK");
    } catch (error) {
        res.status(200).send("OK");
    }
});

module.exports = router;

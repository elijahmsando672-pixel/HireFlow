const db = require("../db");
const {
    SUBSCRIPTION_PRICE_KES,
    SUBSCRIPTION_CURRENCY,
    SUBSCRIPTION_DURATION_DAYS,
    SUBSCRIPTION_PRO_PLAN,
    PAYWALL_ENABLED
} = require("../config");

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

function createSubscription(userId, options = {}) {
    const {
        plan = SUBSCRIPTION_PRO_PLAN,
        status = "PENDING",
        provider = "MOCK",
        providerSubscriptionId = null,
        providerTransactionId = null,
        amount = SUBSCRIPTION_PRICE_KES,
        currency = SUBSCRIPTION_CURRENCY,
        startedAt = null,
        expiresAt = null,
        cancelledAt = null
    } = options;

    const info = db.prepare(`
        INSERT INTO subscriptions (user_id, plan, status, provider, provider_subscription_id, provider_transaction_id, amount, currency, started_at, expires_at, cancelled_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        userId, plan, status, provider, providerSubscriptionId, providerTransactionId,
        amount, currency, startedAt, expiresAt, cancelledAt
    );

    return db.prepare("SELECT * FROM subscriptions WHERE id = ?").get(info.lastInsertRowid);
}

function updateSubscription(id, updates) {
    const fields = [];
    const values = [];

    const map = {
        status: "status",
        plan: "plan",
        provider: "provider",
        provider_subscription_id: "providerSubscriptionId",
        provider_transaction_id: "providerTransactionId",
        amount: "amount",
        currency: "currency",
        started_at: "startedAt",
        expires_at: "expiresAt",
        cancelled_at: "cancelledAt"
    };

    for (const [dbField, jsField] of Object.entries(map)) {
        if (updates[jsField] !== undefined) {
            fields.push(dbField + " = ?");
            values.push(updates[jsField]);
        }
    }

    if (fields.length === 0) return null;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    db.prepare(`UPDATE subscriptions SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return db.prepare("SELECT * FROM subscriptions WHERE id = ?").get(id);
}

function findActiveSubscription(userId) {
    return db.prepare(`
        SELECT * FROM subscriptions
        WHERE user_id = ? AND status = 'ACTIVE' AND expires_at > datetime('now')
        ORDER BY id DESC LIMIT 1
    `).get(userId);
}

function findSubscriptionByProviderTransactionId(providerTransactionId) {
    return db.prepare(`
        SELECT * FROM subscriptions WHERE provider_transaction_id = ?
    `).get(providerTransactionId);
}

function findSubscriptionByOrderTrackingId(orderTrackingId) {
    return db.prepare(`
        SELECT * FROM subscriptions WHERE provider_subscription_id = ?
    `).get(orderTrackingId);
}

function cancelActiveSubscription(userId) {
    const active = findActiveSubscription(userId);
    if (!active) return null;

    return updateSubscription(active.id, {
        status: "CANCELLED",
        cancelledAt: new Date().toISOString()
    });
}

module.exports = {
    serializeSubscription,
    createSubscription,
    updateSubscription,
    findActiveSubscription,
    findSubscriptionByProviderTransactionId,
    findSubscriptionByOrderTrackingId,
    cancelActiveSubscription
};

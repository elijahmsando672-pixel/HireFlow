const db = require("../db");
const {
    SUBSCRIPTION_ENABLED,
    SUBSCRIPTION_PRO_PLAN,
    PAYWALL_ENABLED
} = require("../config");

function getActiveSubscription(userId) {
    return db.prepare(`
        SELECT * FROM subscriptions
        WHERE user_id = ? AND status = 'ACTIVE' AND expires_at > datetime('now')
        ORDER BY id DESC LIMIT 1
    `).get(userId);
}

function getSubscription(userId) {
    return db.prepare(`
        SELECT * FROM subscriptions
        WHERE user_id = ?
        ORDER BY id DESC LIMIT 1
    `).get(userId);
}

function getUserEffectivePlan(userId) {
    const subscription = getActiveSubscription(userId);
    if (subscription && subscription.plan === SUBSCRIPTION_PRO_PLAN) {
        return SUBSCRIPTION_PRO_PLAN;
    }
    return "FREE";
}

function isSubscriptionActive(userId) {
    const subscription = getActiveSubscription(userId);
    return !!subscription;
}

function hasPlan(userId, plan) {
    const effective = getUserEffectivePlan(userId);
    return effective === plan.toUpperCase();
}

function canApply(userId) {
    return hasPlan(userId, SUBSCRIPTION_PRO_PLAN);
}

function canSubmitProposal(userId) {
    return hasPlan(userId, SUBSCRIPTION_PRO_PLAN);
}

function canAccessPremiumJobs(userId) {
    return hasPlan(userId, SUBSCRIPTION_PRO_PLAN);
}

function isPaywallEnabled() {
    return SUBSCRIPTION_ENABLED && PAYWALL_ENABLED;
}

module.exports = {
    getActiveSubscription,
    getSubscription,
    getUserEffectivePlan,
    isSubscriptionActive,
    hasPlan,
    canApply,
    canSubmitProposal,
    canAccessPremiumJobs,
    isPaywallEnabled
};

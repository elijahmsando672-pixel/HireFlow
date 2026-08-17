/**
 * Mock payment provider for development and testing.
 *
 * Simulates the checkout/payment flow without external calls.
 * Always succeeds unless explicitly configured to fail.
 */

const { SUBSCRIPTION_PRICE_KES, SUBSCRIPTION_CURRENCY, SUBSCRIPTION_DURATION_DAYS } = require("../config");

function createCheckout({ reference, amount, currency, description, email, firstName, lastName, phone }) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                mock: true,
                orderTrackingId: "MOCK-" + reference,
                redirectUrl: null,
                status: "SUCCESS"
            });
        }, 100);
    });
}

function getTransactionStatus(orderTrackingId) {
    return Promise.resolve({
        status: "SUCCESS",
        orderTrackingId
    });
}

function processCallback(query) {
    return {
        status: query.payment_status_description || "SUCCESS",
        orderTrackingId: query.order_tracking_id
    };
}

function processIPN(body) {
    return {
        status: body.payment_status_description || body.status || "SUCCESS",
        orderTrackingId: body.order_tracking_id || body.OrderTrackingId || body.orderTrackingId
    };
}

module.exports = {
    createCheckout,
    getTransactionStatus,
    processCallback,
    processIPN
};

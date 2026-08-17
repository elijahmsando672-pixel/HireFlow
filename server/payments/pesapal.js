const {
    PESAPAL_MODE,
    PESAPAL_CONSUMER_KEY,
    PESAPAL_CONSUMER_SECRET,
    PESAPAL_BASE_URL,
    PESAPAL_IFRAME_URL,
    PESAPAL_IPN_URL,
    PESAPAL_CALLBACK_URL,
    SUBSCRIPTION_DURATION_DAYS
} = require("../config");

function isLive() {
    return PESAPAL_MODE === "live" && !!PESAPAL_CONSUMER_KEY && !!PESAPAL_CONSUMER_SECRET;
}

async function requestToken() {
    const auth = Buffer.from(`${PESAPAL_CONSUMER_KEY}:${PESAPAL_CONSUMER_SECRET}`).toString("base64");
    const response = await fetch(`${PESAPAL_BASE_URL}/Auth/RequestToken`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`
        },
        body: JSON.stringify({ grant_type: "client_credentials" })
    });

    if (!response.ok) {
        throw new Error(`Pesapal token request failed (HTTP ${response.status}).`);
    }

    const data = await response.json();
    if (!data.token_type || !data.access_token) {
        throw new Error("Pesapal token response was malformed.");
    }
    return `${data.token_type} ${data.access_token}`;
}

async function registerIpn(token) {
    const url = PESAPAL_IPN_URL || `${PESAPAL_BASE_URL.replace(/\/api$/, "")}/api/subscriptions/ipn`;
    const response = await fetch(`${PESAPAL_BASE_URL}/URLSetup/RegisterIPN`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            url,
            ipn_notification_type: "GET"
        })
    });

    if (!response.ok) {
        throw new Error(`Pesapal IPN registration failed (HTTP ${response.status}).`);
    }

    const data = await response.json();
    if (!data.ipn_id) {
        throw new Error("Pesapal IPN registration returned no ipn_id.");
    }
    return data.ipn_id;
}

async function submitOrder(token, notificationId, order) {
    const response = await fetch(`${PESAPAL_BASE_URL}/Transactions/SubmitOrderRequest`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            id: order.reference,
            currency: order.currency || "KES",
            amount: order.amount,
            description: order.description,
            callback_url: order.callbackUrl,
            notification_id: notificationId,
            branch: "HireFlow",
            source: "WEB",
            billing_address: {
                email_address: order.email,
                first_name: order.firstName,
                last_name: order.lastName,
                phone_number: order.phone || ""
            },
            merchant_reference: order.merchantReference
        })
    });

    if (!response.ok) {
        throw new Error(`Pesapal submit order failed (HTTP ${response.status}).`);
    }

    const data = await response.json();
    if (!data.order_tracking_id || !data.redirect_url) {
        throw new Error("Pesapal order submission returned no tracking id.");
    }
    return {
        orderTrackingId: data.order_tracking_id,
        redirectUrl: data.redirect_url
    };
}

async function queryTransactionStatus(token, orderTrackingId) {
    const response = await fetch(`${PESAPAL_BASE_URL}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`Pesapal transaction status query failed (HTTP ${response.status}).`);
    }

    return response.json();
}

/**
 * Creates a payment session for a subscription.
 * Returns { orderTrackingId, redirectUrl, status }.
 */
async function createCheckout({ reference, amount, currency, description, email, firstName, lastName, phone }) {
    const callbackUrl = PESAPAL_CALLBACK_URL || `${PESAPAL_BASE_URL.replace(/\/api$/, "")}/api/subscriptions/callback`;
    const merchantReference = "SUB-" + reference;

    if (!isLive()) {
        return {
            mock: true,
            orderTrackingId: "MOCK-" + reference,
            redirectUrl: null,
            status: "SUCCESS"
        };
    }

    const token = await requestToken();
    const notificationId = await registerIpn(token);
    const result = await submitOrder(token, notificationId, {
        reference,
        merchantReference,
        amount,
        currency,
        description: description || `HireFlow Pro subscription (${SUBSCRIPTION_DURATION_DAYS} days)`,
        callbackUrl,
        email,
        firstName,
        lastName,
        phone
    });

    return {
        mock: false,
        orderTrackingId: result.orderTrackingId,
        redirectUrl: result.redirectUrl,
        status: "PENDING"
    };
}

async function getTransactionStatus(orderTrackingId) {
    if (!isLive()) {
        return {
            status: "SUCCESS",
            orderTrackingId
        };
    }

    const token = await requestToken();
    const data = await queryTransactionStatus(token, orderTrackingId);
    return {
        status: data.payment_status_description || data.status || "PENDING",
        orderTrackingId
    };
}

function processCallback(query) {
    return {
        status: query.payment_status_description || "SUCCESS",
        orderTrackingId: query.order_tracking_id
    };
}

function processIPN(body) {
    return {
        status: body.payment_status_description || body.PaymentStatusDescription || body.status || "PENDING",
        orderTrackingId: body.order_tracking_id || body.OrderTrackingId || body.orderTrackingId
    };
}

module.exports = {
    createCheckout,
    getTransactionStatus,
    processCallback,
    processIPN,
    isLive,
    PESAPAL_IFRAME_URL
};

const API_BASE = "/api";

function getToken() {
    return localStorage.getItem("hireflow_token");
}

function setToken(token) {
    localStorage.setItem("hireflow_token", token);
}

function clearToken() {
    localStorage.removeItem("hireflow_token");
}

function isLoggedIn() {
    return !!getToken();
}

function logoutUser() {
    clearToken();
    window.location.href = "index.html";
}

function cacheUser(user) {
    localStorage.setItem("hireflow_user", JSON.stringify(user));
}

function getCachedUser() {
    try {
        return JSON.parse(localStorage.getItem("hireflow_user")) || null;
    } catch (error) {
        return null;
    }
}

async function apiRequest(path, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers["Content-Type"] = "application/json";

    const token = getToken();
    if (token) {
        options.headers["Authorization"] = "Bearer " + token;
    }

    const response = await fetch(API_BASE + path, options);

    if (response.status === 401 && token) {
        clearToken();
        window.location.href = "index.html";
        throw new Error("Your session has expired. Please log in again.");
    }

    const data = await response.json().catch(function () {
        return {};
    });

    if (!response.ok) {
        throw new Error(data.error || "Request failed.");
    }

    return data;
}

async function apiLogin(credentials) {
    return apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials)
    });
}

async function apiRegister(user) {
    return apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(user)
    });
}

async function apiGetMe() {
    return apiRequest("/auth/me");
}

async function apiUpdateProfile(profile) {
    return apiRequest("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(profile)
    });
}

async function apiGetJobs(filters) {
    filters = filters || {};
    const params = new URLSearchParams();

    Object.keys(filters).forEach(function (key) {
        if (filters[key]) params.append(key, filters[key]);
    });

    const qs = params.toString();
    return apiRequest("/jobs" + (qs ? "?" + qs : ""));
}

async function apiGetJob(id) {
    return apiRequest("/jobs/" + id);
}

async function apiGetMyApplications() {
    return apiRequest("/applications/mine");
}

async function apiApply(jobId) {
    return apiRequest("/applications", {
        method: "POST",
        body: JSON.stringify({ jobId: jobId })
    });
}

function formatSalary(salary) {
    return "KSh " + Number(salary).toLocaleString();
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    return days + " days ago";
}

function getUserInitials(user) {
    const first = (user.firstName || "").charAt(0);
    const last = (user.lastName || "").charAt(0);
    return (first + last).toUpperCase() || "C";
}

async function apiPostJob(job) {
    return apiRequest("/jobs", {
        method: "POST",
        body: JSON.stringify(job)
    });
}

async function apiGetMyJobs() {
    return apiRequest("/jobs/mine");
}

async function apiGetJobProposals(jobId) {
    return apiRequest("/jobs/" + jobId + "/proposals");
}

async function apiCreateProposal(proposal) {
    return apiRequest("/proposals", {
        method: "POST",
        body: JSON.stringify(proposal)
    });
}

async function apiGetMyProposals() {
    return apiRequest("/proposals/mine");
}

async function apiUpdateProposal(id, status) {
    return apiRequest("/proposals/" + id, {
        method: "PUT",
        body: JSON.stringify({ status: status })
    });
}

async function apiGetGigs(filters) {
    filters = filters || {};
    const params = new URLSearchParams();

    Object.keys(filters).forEach(function (key) {
        if (filters[key]) params.append(key, filters[key]);
    });

    const qs = params.toString();
    return apiRequest("/gigs" + (qs ? "?" + qs : ""));
}

async function apiGetGig(id) {
    return apiRequest("/gigs/" + id);
}

async function apiGetMyGigs() {
    return apiRequest("/gigs/mine");
}

async function apiCreateGig(gig) {
    return apiRequest("/gigs", {
        method: "POST",
        body: JSON.stringify(gig)
    });
}

async function apiCreateOrder(order) {
    return apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify(order)
    });
}

async function apiGetMyOrders() {
    return apiRequest("/orders/mine");
}

async function apiUpdateOrder(id, status) {
    return apiRequest("/orders/" + id, {
        method: "PUT",
        body: JSON.stringify({ status: status })
    });
}

async function apiCreateReview(review) {
    return apiRequest("/reviews", {
        method: "POST",
        body: JSON.stringify(review)
    });
}

async function apiCreateContract(proposalId) {
    return apiRequest("/contracts", {
        method: "POST",
        body: JSON.stringify({ proposalId: proposalId })
    });
}

async function apiGetContracts() {
    return apiRequest("/contracts");
}

async function apiGetContract(id) {
    return apiRequest("/contracts/" + id);
}

async function apiPayContract(id, method, reference) {
    return apiRequest("/contracts/" + id + "/pay", {
        method: "POST",
        body: JSON.stringify({ method: method, reference: reference || "" })
    });
}

async function apiDeliverContract(id, deliveryNote) {
    return apiRequest("/contracts/" + id + "/deliver", {
        method: "POST",
        body: JSON.stringify({ deliveryNote: deliveryNote })
    });
}

async function apiCompleteContract(id) {
    return apiRequest("/contracts/" + id + "/complete", { method: "POST" });
}

async function apiCancelContract(id) {
    return apiRequest("/contracts/" + id + "/cancel", { method: "POST" });
}

async function apiSendMessage(message) {
    return apiRequest("/messages", {
        method: "POST",
        body: JSON.stringify(message)
    });
}

async function apiGetConversations() {
    return apiRequest("/messages/conversations");
}

async function apiGetThread(userId) {
    return apiRequest("/messages/" + userId);
}

async function apiGetUser(userId) {
    return apiRequest("/users/" + userId);
}

async function apiGetSavedJobs() {
    return apiRequest("/saved/jobs");
}

async function apiSaveJob(jobId) {
    return apiRequest("/saved/jobs", {
        method: "POST",
        body: JSON.stringify({ jobId: jobId })
    });
}

async function apiUnsaveJob(jobId) {
    return apiRequest("/saved/jobs/" + jobId, { method: "DELETE" });
}

async function apiGetSavedGigs() {
    return apiRequest("/saved/gigs");
}

async function apiSaveGig(gigId) {
    return apiRequest("/saved/gigs", {
        method: "POST",
        body: JSON.stringify({ gigId: gigId })
    });
}

async function apiUnsaveGig(gigId) {
    return apiRequest("/saved/gigs/" + gigId, { method: "DELETE" });
}

async function apiGetAggregatedJobs(filters) {
    filters = filters || {};
    const params = new URLSearchParams();

    Object.keys(filters).forEach(function (key) {
        if (filters[key] !== undefined && filters[key] !== "") {
            params.append(key, filters[key]);
        }
    });

    const qs = params.toString();
    return apiRequest("/aggregated-jobs" + (qs ? "?" + qs : ""));
}

async function apiGetAggregatedJob(id) {
    return apiRequest("/aggregated-jobs/" + id);
}

async function apiGetSubscriptionStatus() {
    return apiRequest("/subscriptions/status");
}

async function apiGetMySubscription() {
    return apiRequest("/subscriptions/me");
}

async function apiCreateCheckout() {
    return apiRequest("/subscriptions/checkout", { method: "POST" });
}

function formatBudget(job) {
    const min = job.budgetMin;
    const max = job.budgetMax;
    const currency = job.currency || "KES";

    if (min == null && max == null) return "";
    if (min === max) return currency + " " + Number(min).toLocaleString();
    return currency + " " + Number(min).toLocaleString() + " - " + Number(max).toLocaleString();
}

function escapeHtml(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatSalary(salary) {
    return "KSh " + Number(salary).toLocaleString();
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    return days + " days ago";
}

function getUserInitials(user) {
    const first = (user.firstName || "").charAt(0);
    const last = (user.lastName || "").charAt(0);
    return (first + last).toUpperCase() || "C";
}

function formatPrice(amount) {
    return "KSh " + Number(amount || 0).toLocaleString();
}

function starRating(rating) {
    rating = Math.round(rating) || 0;
    let stars = "";
    for (let i = 0; i < 5; i++) {
        stars += i < rating ? "★" : "☆";
    }
    return stars;
}

function setupNav(active) {
    if (!isLoggedIn()) {
        window.location.href = "index.html";
        return;
    }

    const cached = getCachedUser();
    if (cached) {
        const navAvatar = document.getElementById("navAvatar");
        const navName = document.getElementById("navName");
        if (navAvatar) navAvatar.textContent = getUserInitials(cached);
        if (navName) navName.textContent = cached.firstName || "Candidate";
    }

    if (active) {
        document.querySelectorAll(".nav-link").forEach(function (link) {
            const href = link.getAttribute("href") || "";
            if (href.split(".")[0] === active) link.classList.add("active");
        });
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);
}

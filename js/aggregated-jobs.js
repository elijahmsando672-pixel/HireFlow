function getUniqueValues(key, jobs) {
    const values = [];
    jobs.forEach(function (job) {
        const val = key === "remote" ? String(job.remote) : job[key];
        if (values.indexOf(val) === -1) values.push(val);
    });
    return values.sort();
}

function populateFilter(selectId, key, jobs) {
    const select = document.getElementById(selectId);
    if (!select) return;
    getUniqueValues(key, jobs).forEach(function (value) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

function buildAggregatedJobCard(job) {
    const card = document.createElement("a");
    card.className = "job-card";
    card.href = "aggregated-job-details.html?id=" + job.id;

    const budget = formatBudget(job);
    const skills = (job.skills || []).slice(0, 4).map(function (s) { return escapeHtml(s); }).join(" &middot; ");

    card.innerHTML =
        '<div class="job-card-top">' +
        "<h3>" + escapeHtml(job.title) + "</h3>" +
        '<span class="badge badge-external">External</span>' +
        "</div>" +
        '<p class="job-company">' + escapeHtml(job.companyName || "Confidential") + "</p>" +
        '<div class="job-meta">' +
        "<span>" + escapeHtml(job.location || "Remote") + "</span>" +
        "<span>" + escapeHtml(job.jobType || "Contract") + "</span>" +
        (budget ? "<span>" + escapeHtml(budget) + "</span>" : "") +
        "<span>Posted " + timeAgo(job.postedAt) + "</span>" +
        "</div>" +
        (skills ? '<p class="job-snippet">' + skills + "</p>" : "");

    return card;
}

async function renderAggregatedJobs() {
    const grid = document.getElementById("jobGrid");
    const empty = document.getElementById("emptyState");
    const count = document.getElementById("resultsCount");

    if (!grid) return;

    const data = await apiGetAggregatedJobs({
        search: document.getElementById("searchInput").value,
        category: document.getElementById("categoryFilter").value,
        job_type: document.getElementById("typeFilter").value,
        remote: document.getElementById("remoteFilter").value,
        sort: document.getElementById("sortFilter").value,
        status: "ACTIVE"
    });

    const jobs = data.data || [];

    grid.innerHTML = "";
    if (count) count.textContent = jobs.length;
    if (empty) empty.style.display = jobs.length === 0 ? "block" : "none";

    jobs.forEach(function (job) {
        grid.appendChild(buildAggregatedJobCard(job));
    });
}

async function initAggregatedJobs() {
    if (!isLoggedIn()) {
        window.location.href = "index.html";
        return;
    }

    setupNav("aggregated-jobs");

    try {
        const data = await apiGetAggregatedJobs({ status: "ACTIVE" });
        const jobs = data.data || [];

        populateFilter("categoryFilter", "category", jobs);
        populateFilter("typeFilter", "jobType", jobs);

        await renderAggregatedJobs();
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", initAggregatedJobs);

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const typeFilter = document.getElementById("typeFilter");
const remoteFilter = document.getElementById("remoteFilter");
const sortFilter = document.getElementById("sortFilter");

if (searchInput) searchInput.addEventListener("input", renderAggregatedJobs);
if (categoryFilter) categoryFilter.addEventListener("change", renderAggregatedJobs);
if (typeFilter) typeFilter.addEventListener("change", renderAggregatedJobs);
if (remoteFilter) remoteFilter.addEventListener("change", renderAggregatedJobs);
if (sortFilter) sortFilter.addEventListener("change", renderAggregatedJobs);

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

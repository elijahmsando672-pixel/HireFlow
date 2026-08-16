function getUniqueValues(key, jobs) {
    const values = [];

    jobs.forEach(function (job) {
        if (values.indexOf(job[key]) === -1) values.push(job[key]);
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

function buildJobCard(job) {
    const card = document.createElement("a");
    card.className = "job-card";
    card.href = "job-details.html?id=" + job.id;

    card.innerHTML =
        '<div class="job-card-top">' +
        "<h3>" + escapeHtml(job.title) + "</h3>" +
        '<span class="badge badge-' + job.category.toLowerCase() + '">' + escapeHtml(job.category) + "</span>" +
        "</div>" +
        '<p class="job-company">' + escapeHtml(job.company) + "</p>" +
        '<div class="job-meta">' +
        "<span>" + escapeHtml(job.location) + "</span>" +
        "<span>" + escapeHtml(job.type) + "</span>" +
        "<span>" + formatSalary(job.salary) + "</span>" +
        "<span>Posted " + timeAgo(job.posted) + "</span>" +
        "<span>" + (job.proposalCount || 0) + " proposal" + (job.proposalCount === 1 ? "" : "s") + "</span>" +
        "</div>" +
        '<p class="job-snippet">' + escapeHtml(job.description) + "</p>";

    return card;
}

async function renderJobs() {
    const grid = document.getElementById("jobGrid");
    const empty = document.getElementById("emptyState");
    const count = document.getElementById("resultsCount");

    if (!grid) return;

    const data = await apiGetJobs({
        search: document.getElementById("searchInput").value,
        category: document.getElementById("categoryFilter").value,
        location: document.getElementById("locationFilter").value,
        type: document.getElementById("typeFilter").value,
        sort: document.getElementById("sortFilter").value
    });

    const jobs = data.jobs;

    grid.innerHTML = "";

    if (count) count.textContent = jobs.length;
    if (empty) empty.style.display = jobs.length === 0 ? "block" : "none";

    jobs.forEach(function (job) {
        grid.appendChild(buildJobCard(job));
    });
}

async function initJobs() {
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

    try {
        const allData = await apiGetJobs();

        populateFilter("categoryFilter", "category", allData.jobs);
        populateFilter("locationFilter", "location", allData.jobs);
        populateFilter("typeFilter", "type", allData.jobs);

        await renderJobs();
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", initJobs);

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const locationFilter = document.getElementById("locationFilter");
const typeFilter = document.getElementById("typeFilter");
const sortFilter = document.getElementById("sortFilter");

if (searchInput) searchInput.addEventListener("input", renderJobs);
if (categoryFilter) categoryFilter.addEventListener("change", renderJobs);
if (locationFilter) locationFilter.addEventListener("change", renderJobs);
if (typeFilter) typeFilter.addEventListener("change", renderJobs);
if (sortFilter) sortFilter.addEventListener("change", renderJobs);

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

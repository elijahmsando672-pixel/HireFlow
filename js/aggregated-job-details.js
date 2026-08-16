function renderJobDetail(job) {
    const container = document.getElementById("jobDetail");
    if (!container) return;

    const budget = formatBudget(job);
    const skills = (job.skills || []).map(function (s) { return "<li>" + escapeHtml(s) + "</li>"; }).join("");

    container.innerHTML =
        '<div class="job-detail-card">' +
        "<h1>" + escapeHtml(job.title) + "</h1>" +
        '<p class="job-detail-company">' + escapeHtml(job.companyName || "Confidential") + "</p>" +
        '<div class="job-detail-meta">' +
        '<span class="badge badge-external">External</span>' +
        "<span>" + escapeHtml(job.location || "Remote") + "</span>" +
        "<span>" + escapeHtml(job.jobType || "Contract") + "</span>" +
        (budget ? "<span>" + escapeHtml(budget) + "</span>" : "") +
        "<span>Posted " + timeAgo(job.postedAt) + "</span>" +
        "</div>" +
        '<div class="job-detail-section">' +
        "<h2>About this role</h2>" +
        "<p>" + escapeHtml(job.description) + "</p>" +
        "</div>" +
        (skills ? '<div class="job-detail-section"><h2>Skills</h2><ul class="requirement-list">' + skills + "</ul></div>" : "") +
        "</div>";
}

function renderExternalAction(job) {
    const container = document.getElementById("externalAction");
    if (!container) return;

    const sourceLabel = job.source ? job.source.replace(/_/g, " ").replace(/\b\w/g, function (l) { return l.toUpperCase(); }) : "External Source";

    container.innerHTML =
        '<div class="apply-box">' +
        "<p class=\"empty-note\">This job is posted on an external site. You will leave HireFlow to apply.</p>" +
        '<a href="' + escapeHtml(job.sourceUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary">View Original Posting</a>' +
        '<p style="margin-top: 10px; font-size: 13px; color: #6b7280;">Source: " + escapeHtml(sourceLabel) + "</p>" +
        "</div>";
}

async function initAggregatedJobDetails() {
    setupNav("aggregated-jobs");

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"), 10);

    try {
        const data = await apiGetAggregatedJob(id);
        const job = data.data;

        renderJobDetail(job);
        renderExternalAction(job);
    } catch (error) {
        if (error.message === "Job not found.") {
            window.location.href = "aggregated-jobs.html";
        } else {
            alert(error.message);
        }
    }
}

document.addEventListener("DOMContentLoaded", initAggregatedJobDetails);

function renderJobDetail(job) {
    const container = document.getElementById("jobDetail");
    if (!container) return;

    const requirementsList = job.requirements.map(function (req) {
        return "<li>" + escapeHtml(req) + "</li>";
    }).join("");

    container.innerHTML =
        '<div class="job-detail-card">' +
        "<h1>" + escapeHtml(job.title) + "</h1>" +
        '<p class="job-detail-company">' + escapeHtml(job.company) + "</p>" +
        '<div class="job-detail-meta">' +
        '<span class="badge badge-' + job.category.toLowerCase() + '">' + escapeHtml(job.category) + "</span>" +
        "<span>" + escapeHtml(job.location) + "</span>" +
        "<span>" + escapeHtml(job.type) + "</span>" +
        "<span>" + formatSalary(job.salary) + "</span>" +
        "<span>Posted " + timeAgo(job.posted) + "</span>" +
        "<span>" + job.proposalCount + " proposal" + (job.proposalCount === 1 ? "" : "s") + "</span>" +
        "</div>" +
        '<div class="job-detail-section">' +
        "<h2>About the role</h2>" +
        "<p>" + escapeHtml(job.description) + "</p>" +
        "</div>" +
        '<div class="job-detail-section">' +
        "<h2>Requirements</h2>" +
        '<ul class="requirement-list">' + requirementsList + "</ul>" +
        "</div>" +
        "</div>";
}

function proposalFormHtml(jobId) {
    return '<div class="proposal-form">' +
        "<h2 class=\"card-title\">Submit a proposal</h2>" +
        "<p class=\"empty-note\">Tell the client why you are the right fit and how much it will cost.</p>" +
        '<div class="form-row" style="margin-bottom: 16px;">' +
        '<div class="form-group">' +
        "<label>Proposed rate (KSh)</label>" +
        '<input type="number" id="proposalRate" min="0" placeholder="e.g. 45000">' +
        "</div>" +
        '<div class="form-group">' +
        "<label>Timeline (days)</label>" +
        '<input type="number" id="proposalTimeline" min="1" placeholder="e.g. 14">' +
        "</div>" +
        "</div>" +
        '<div class="form-group">' +
        "<label>Cover letter</label>" +
        '<textarea id="proposalCover" rows="5" placeholder="Summarise your experience, approach and why you are a good fit..."></textarea>' +
        "</div>" +
        '<button id="submitProposal" class="btn btn-primary">Submit Proposal</button>' +
        '<p id="proposalStatus" class="apply-status"></p>' +
        "</div>";
}

async function loadSaveState(jobId) {
    const saveBtn = document.getElementById("saveJobBtn");
    if (!saveBtn) return;

    try {
        const data = await apiGetSavedJobs();
        const saved = data.jobs.some(function (job) {
            return job.id === jobId;
        });

        if (saved) {
            saveBtn.classList.add("saved");
            saveBtn.textContent = "\u2605 Saved";
        }

        saveBtn.addEventListener("click", async function () {
            saveBtn.disabled = true;

            try {
                if (saveBtn.classList.contains("saved")) {
                    await apiUnsaveJob(jobId);
                    saveBtn.classList.remove("saved");
                    saveBtn.textContent = "\u2606 Save job";
                } else {
                    await apiSaveJob(jobId);
                    saveBtn.classList.add("saved");
                    saveBtn.textContent = "\u2605 Saved";
                }
            } catch (error) {
                alert(error.message);
            }

            saveBtn.disabled = false;
        });
    } catch (error) {
        alert(error.message);
    }
}

function renderProposalArea(job, myProposals) {
    const container = document.getElementById("proposalArea");
    if (!container) return;

    if (job.postedBy && job.postedBy === (getCachedUser() || {}).id) {
        container.innerHTML =
            '<div class="proposal-form">' +
            "<p class=\"empty-note\">This is a job you posted. Review proposals and manage candidates from your dashboard.</p>" +
            '<a href="my-jobs.html" class="btn btn-outline">Review proposals</a>' +
            "</div>";
        return;
    }

    const mine = myProposals.find(function (proposal) {
        return proposal.jobId === job.id;
    });

    if (mine) {
        container.innerHTML =
            '<div class="proposal-form">' +
            "<h2 class=\"card-title\">Your proposal</h2>" +
            '<p class="empty-note">Submitted ' + timeAgo(mine.createdAt) + ".</p>" +
            '<p class="proposal-cover">' + escapeHtml(mine.coverLetter) + "</p>" +
            '<p class="proposal-rate" style="margin-top: 10px;">' + formatPrice(mine.rate) + " &middot; " + mine.timelineDays + " days</p>" +
            '<div style="margin-top: 12px;"><span class="status-badge status-' + mine.status.toLowerCase() + '">' + mine.status + "</span></div>" +
            "</div>";
        return;
    }

    container.innerHTML = proposalFormHtml(job.id);

    const submitBtn = document.getElementById("submitProposal");
    const statusEl = document.getElementById("proposalStatus");

    submitBtn.addEventListener("click", async function () {
        const coverLetter = document.getElementById("proposalCover").value;
        const rate = document.getElementById("proposalRate").value;
        const timelineDays = document.getElementById("proposalTimeline").value;

        if (!coverLetter || !rate || !timelineDays) {
            statusEl.style.color = "#991b1b";
            statusEl.textContent = "Please fill in all fields.";
            return;
        }

        submitBtn.disabled = true;
        statusEl.style.color = "#166534";

        try {
            await apiCreateProposal({
                jobId: job.id,
                coverLetter: coverLetter,
                rate: parseInt(rate, 10),
                timelineDays: parseInt(timelineDays, 10)
            });

            statusEl.textContent = "Proposal submitted! Track it on your dashboard.";
            submitBtn.textContent = "Submitted";
            location.reload();
        } catch (error) {
            submitBtn.disabled = false;
            statusEl.style.color = "#991b1b";
            statusEl.textContent = error.message;
        }
    });
}

async function initJobDetails() {
    setupNav("jobs");

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"), 10);

    try {
        const jobData = await apiGetJob(id);
        const job = jobData.job;

        renderJobDetail(job);
        loadSaveState(job.id);

        const myData = await apiGetMyProposals();
        renderProposalArea(job, myData.proposals);
    } catch (error) {
        if (error.message === "Job not found.") {
            window.location.href = "jobs.html";
        } else {
            alert(error.message);
        }
    }
}

document.addEventListener("DOMContentLoaded", initJobDetails);

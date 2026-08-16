function calculateProfileStrength(user) {
    const fields = [
        user.firstName,
        user.lastName,
        user.email,
        user.phone,
        user.headline,
        user.bio,
        user.skills && user.skills.length,
        user.education,
        user.portfolio
    ];

    const filled = fields.filter(function (value) {
        return value;
    }).length;

    return Math.round((filled / fields.length) * 100);
}

function renderNav(user) {
    const navAvatar = document.getElementById("navAvatar");
    const navName = document.getElementById("navName");

    if (navAvatar) navAvatar.textContent = getUserInitials(user);
    if (navName) navName.textContent = user.firstName || "Candidate";
}

function renderProfile(user) {
    const avatar = document.getElementById("profileAvatar");
    const name = document.getElementById("profileName");
    const details = document.getElementById("profileDetails");
    const cta = document.getElementById("profileCta");
    const headline = document.getElementById("profileHeadline");
    const bio = document.getElementById("profileBio");
    const email = document.getElementById("profileEmail");
    const phone = document.getElementById("profilePhone");
    const education = document.getElementById("profileEducation");
    const skillsContainer = document.getElementById("profileSkills");
    const linksContainer = document.getElementById("profileLinks");

    if (avatar) avatar.textContent = getUserInitials(user);
    if (name) name.textContent = (user.firstName + " " + (user.lastName || "")).trim() || "Candidate";

    const hasProfile = !!(user.headline && user.bio);

    if (details && cta) {
        details.style.display = hasProfile ? "block" : "none";
        cta.style.display = hasProfile ? "none" : "block";
    }

    if (!hasProfile) return;

    if (headline) headline.textContent = user.headline;
    if (bio) bio.textContent = user.bio;
    if (email) email.textContent = user.email || "—";
    if (phone) phone.textContent = user.phone || "—";
    if (education) education.textContent = user.education || "—";

    if (skillsContainer) {
        skillsContainer.innerHTML = "";

        (user.skills || []).forEach(function (skill) {
            const chip = document.createElement("span");
            chip.className = "chip";
            chip.textContent = skill;
            skillsContainer.appendChild(chip);
        });
    }

    if (linksContainer) {
        linksContainer.innerHTML = "";

        [
            { name: "LinkedIn", url: user.linkedin },
            { name: "GitHub", url: user.github },
            { name: "Portfolio", url: user.portfolio }
        ].forEach(function (link) {
            if (link.url) {
                const anchor = document.createElement("a");
                anchor.className = "link-chip";
                anchor.href = link.url;
                anchor.target = "_blank";
                anchor.rel = "noopener";
                anchor.textContent = link.name;
                linksContainer.appendChild(anchor);
            }
        });
    }
}

function renderStats(user, proposals, jobs) {
    const apps = document.getElementById("statApplications");
    const openings = document.getElementById("statOpenings");
    const strength = document.getElementById("statStrength");
    const interviews = document.getElementById("statInterviews");

    if (apps) apps.textContent = proposals.length;
    if (openings) openings.textContent = jobs.length;
    if (strength) strength.textContent = calculateProfileStrength(user) + "%";
    if (interviews) interviews.textContent = 0;
}

function renderProposals(proposals) {
    const container = document.getElementById("proposalsList");
    const countEl = document.getElementById("proposalsCount");
    const emptyEl = document.getElementById("proposalsEmpty");

    if (!container) return;

    if (countEl) countEl.textContent = proposals.length;

    container.innerHTML = "";

    if (proposals.length === 0) {
        if (emptyEl) emptyEl.style.display = "block";
        return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    proposals.forEach(function (proposal) {
        const item = document.createElement("div");
        item.className = "application-item";

        const info = document.createElement("div");
        info.className = "application-info";

        const title = document.createElement("h4");
        title.textContent = proposal.title;

        const meta = document.createElement("p");
        meta.textContent = proposal.company + " · " + formatPrice(proposal.rate) + " · " + timeAgo(proposal.createdAt);

        info.appendChild(title);
        info.appendChild(meta);

        const badge = document.createElement("span");
        badge.className = "status-badge status-" + proposal.status.toLowerCase();
        badge.textContent = proposal.status;

        item.appendChild(info);
        item.appendChild(badge);

        container.appendChild(item);
    });
}

function renderRecommendedJobs(jobs) {
    const container = document.getElementById("recommendedJobs");
    if (!container) return;

    container.innerHTML = "";

    jobs.slice(0, 4).forEach(function (job) {
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
            "</div>";

        container.appendChild(card);
    });
}

function renderContracts(contracts) {
    const card = document.getElementById("contractsCard");
    const list = document.getElementById("contractsList");
    const empty = document.getElementById("contractsEmpty");

    if (!card || !list || !empty) return;

    const active = contracts.filter(function (c) {
        return ["Active", "Paid", "Delivered"].indexOf(c.status) !== -1;
    });

    card.style.display = "block";

    if (active.length === 0) {
        empty.style.display = "block";
        list.innerHTML = "";
        return;
    }

    empty.style.display = "none";
    list.innerHTML = "";

    active.slice(0, 4).forEach(function (contract) {
        const link = document.createElement("a");
        link.className = "list-item";
        link.href = "contract-details.html?id=" + contract.id;

        const info = document.createElement("div");
        info.style.flex = "1";
        info.style.minWidth = "0";

        const title = document.createElement("h4");
        title.textContent = contract.title;

        const meta = document.createElement("p");
        meta.className = "muted";
        meta.textContent = formatPrice(contract.amount) + " · " + timeAgo(contract.createdAt);

        info.appendChild(title);
        info.appendChild(meta);

        const badge = document.createElement("span");
        badge.className = "status-badge status-" + contract.status.toLowerCase().replace(/\s/g, "-");
        badge.textContent = contract.status;

        link.appendChild(info);
        link.appendChild(badge);
        list.appendChild(link);
    });
}

async function initDashboard() {
    if (!isLoggedIn()) {
        window.location.href = "index.html";
        return;
    }

    const cached = getCachedUser();
    if (cached) renderNav(cached);

    try {
        const meData = await apiGetMe();
        const propsData = await apiGetMyProposals();
        const jobsData = await apiGetJobs();
        const contractsData = await apiGetContracts();

        const user = meData.user;
        const proposals = propsData.proposals;
        const jobs = jobsData.jobs;
        const contracts = contractsData.contracts;

        cacheUser(user);
        renderNav(user);

        const welcomeName = document.getElementById("welcomeName");
        if (welcomeName) welcomeName.textContent = user.firstName || "Candidate";

        renderStats(user, proposals, jobs);
        renderProfile(user);
        renderProposals(proposals);
        renderContracts(contracts);
        renderRecommendedJobs(jobs);
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", initDashboard);

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

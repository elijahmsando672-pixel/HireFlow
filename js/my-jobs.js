async function renderProposals(jobId, container) {
    const data = await apiGetJobProposals(jobId);

    if (data.proposals.length === 0) {
        container.innerHTML = '<p class="empty-note">No proposals yet.</p>';
        return;
    }

    container.innerHTML = "";

    data.proposals.forEach(function (proposal) {
        const item = document.createElement("div");
        item.className = "proposal-item";

        const head = document.createElement("div");
        head.className = "proposal-head";

        const who = document.createElement("div");
        const name = document.createElement("h4");
        name.textContent = proposal.firstName + " " + proposal.lastName;
        const headline = document.createElement("p");
        headline.className = "muted";
        headline.textContent = proposal.headline || "Freelancer";

        who.appendChild(name);
        who.appendChild(headline);

        const badges = document.createElement("div");
        badges.className = "list-item-actions";
        badges.innerHTML = '<span class="status-badge status-' + proposal.status.toLowerCase() + '">' + proposal.status + "</span>";

        head.appendChild(who);
        head.appendChild(badges);

        const rate = document.createElement("p");
        rate.className = "proposal-rate";
        rate.style.marginTop = "10px";
        rate.textContent = formatPrice(proposal.rate) + " · " + proposal.timelineDays + " day delivery";

        const cover = document.createElement("p");
        cover.className = "proposal-cover";
        cover.textContent = proposal.coverLetter;

        const skills = document.createElement("div");
        skills.className = "skill-chips";
        skills.style.justifyContent = "flex-start";
        skills.style.marginTop = "10px";

        (proposal.skills || []).slice(0, 4).forEach(function (skill) {
            const chip = document.createElement("span");
            chip.className = "chip";
            chip.textContent = skill;
            skills.appendChild(chip);
        });

        const actions = document.createElement("div");
        actions.className = "list-item-actions";
        actions.style.marginTop = "12px";

        const message = document.createElement("a");
        message.className = "btn btn-outline btn-sm";
        message.href = "messages.html?user=" + proposal.userId;
        message.textContent = "Message";

        const acceptBtn = document.createElement("button");
        acceptBtn.className = "btn btn-primary btn-sm";
        acceptBtn.textContent = "Hire & start contract";
        acceptBtn.disabled = proposal.status !== "Pending";

        const rejectBtn = document.createElement("button");
        rejectBtn.className = "btn btn-danger btn-sm";
        rejectBtn.textContent = "Reject";
        rejectBtn.disabled = proposal.status !== "Pending";

        acceptBtn.addEventListener("click", async function () {
            try {
                const data = await apiCreateContract(proposal.id);
                window.location.href = "contract-details.html?id=" + data.contract.id;
            } catch (error) {
                alert(error.message);
            }
        });

        rejectBtn.addEventListener("click", async function () {
            try {
                await apiUpdateProposal(proposal.id, "Rejected");
                renderProposals(jobId, container);
            } catch (error) {
                alert(error.message);
            }
        });

        actions.appendChild(message);
        if (proposal.status === "Pending") {
            actions.appendChild(acceptBtn);
            actions.appendChild(rejectBtn);
        } else if (proposal.status === "Accepted") {
            const viewContract = document.createElement("a");
            viewContract.className = "btn btn-outline btn-sm";
            viewContract.href = "contracts.html";
            viewContract.textContent = "View contract";
            actions.appendChild(viewContract);
        }

        item.appendChild(head);
        item.appendChild(rate);
        item.appendChild(cover);
        if (proposal.skills && proposal.skills.length) item.appendChild(skills);
        item.appendChild(actions);

        container.appendChild(item);
    });
}

function buildJobCard(job) {
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "20px";

    const header = document.createElement("div");
    header.className = "proposal-head";

    const info = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = job.title;
    const meta = document.createElement("p");
    meta.className = "muted";
    meta.textContent = job.company + " · " + job.location + " · " + job.type + " · " + formatSalary(job.salary) + " · " + job.proposalCount + " proposals";

    info.appendChild(title);
    info.appendChild(meta);

    const toggle = document.createElement("button");
    toggle.className = "btn btn-outline btn-sm";
    toggle.textContent = job.proposalCount > 0 ? "View proposals (" + job.proposalCount + ")" : "No proposals yet";

    header.appendChild(info);
    header.appendChild(toggle);

    const panel = document.createElement("div");
    panel.className = "expandable";

    toggle.addEventListener("click", async function () {
        if (panel.classList.contains("open")) {
            panel.classList.remove("open");
            return;
        }

        panel.classList.add("open");
        panel.innerHTML = '<p class="empty-note">Loading proposals...</p>';

        try {
            await renderProposals(job.id, panel);
        } catch (error) {
            panel.innerHTML = '<p class="empty-note">' + escapeHtml(error.message) + "</p>";
        }
    });

    card.appendChild(header);
    card.appendChild(panel);

    return card;
}

async function initMyJobs() {
    setupNav("dashboard");

    try {
        const data = await apiGetMyJobs();
        const jobs = data.jobs;

        const container = document.getElementById("myJobsList");
        const empty = document.getElementById("myJobsEmpty");

        if (!container) return;

        if (jobs.length === 0) {
            if (empty) empty.style.display = "block";
            return;
        }

        if (empty) empty.style.display = "none";

        jobs.forEach(function (job) {
            container.appendChild(buildJobCard(job));
        });
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", initMyJobs);

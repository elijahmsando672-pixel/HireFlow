function proposalStatusBadge(status) {
    return '<span class="status-badge status-' + status.toLowerCase() + '">' + status + "</span>";
}

function buildProposalItem(proposal) {
    const item = document.createElement("div");
    item.className = "list-item";
    item.style.alignItems = "flex-start";

    const info = document.createElement("div");
    info.style.flex = "1";

    const top = document.createElement("div");
    top.style.display = "flex";
    top.style.justifyContent = "space-between";
    top.style.gap = "12px";
    top.style.flexWrap = "wrap";

    const title = document.createElement("h4");
    title.textContent = proposal.title;

    const badgeWrap = document.createElement("div");
    badgeWrap.innerHTML = proposalStatusBadge(proposal.status);

    top.appendChild(title);
    top.appendChild(badgeWrap);

    const meta = document.createElement("p");
    meta.className = "muted";
    meta.textContent = proposal.company + " · " + proposal.location + " · " + timeAgo(proposal.createdAt);

    const rate = document.createElement("p");
    rate.className = "proposal-rate";
    rate.style.marginTop = "6px";
    rate.textContent = formatPrice(proposal.rate) + " · " + proposal.timelineDays + " day delivery";

    const cover = document.createElement("p");
    cover.className = "proposal-cover";
    cover.style.marginTop = "8px";
    cover.textContent = proposal.coverLetter;

    info.appendChild(top);
    info.appendChild(meta);
    info.appendChild(rate);
    info.appendChild(cover);

    const actions = document.createElement("div");
    actions.className = "list-item-actions";

    const view = document.createElement("a");
    view.className = "btn btn-outline btn-sm";
    view.href = "job-details.html?id=" + proposal.jobId;
    view.textContent = "View job";
    actions.appendChild(view);

    item.appendChild(info);
    item.appendChild(actions);

    return item;
}

async function initMyProposals() {
    setupNav("dashboard");

    try {
        const data = await apiGetMyProposals();
        const proposals = data.proposals;

        const container = document.getElementById("proposalsList");
        const empty = document.getElementById("proposalsEmpty");

        if (!container) return;

        container.innerHTML = "";

        if (proposals.length === 0) {
            if (empty) empty.style.display = "block";
            return;
        }

        if (empty) empty.style.display = "none";

        proposals.forEach(function (proposal) {
            container.appendChild(buildProposalItem(proposal));
        });
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", initMyProposals);

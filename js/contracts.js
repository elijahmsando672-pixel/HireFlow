let contractsData = [];
let currentTab = "all";

function contractStatusBadge(status) {
    return '<span class="status-badge status-' + status.toLowerCase().replace(/\s/g, "-") + '">' + escapeHtml(status) + "</span>";
}

function buildContractCard(contract, currentUser) {
    const isClient = contract.clientId === currentUser.id;
    const counterpart = isClient ? contract.freelancer : contract.client;
    const label = isClient ? "Hiring" : "Working with";

    const card = document.createElement("a");
    card.className = "contract-card";
    card.href = "contract-details.html?id=" + contract.id;

    card.innerHTML =
        '<div class="contract-card-top">' +
        "<div>" +
        '<h3 class="contract-title">' + escapeHtml(contract.title) + "</h3>" +
        '<p class="muted contract-meta">' + escapeHtml(label) + " " + escapeHtml(counterpart.firstName + " " + (counterpart.lastName || "")) +
        " · " + (contract.type === "gig" ? "Gig order" : "Job hire") + " · " + timeAgo(contract.createdAt) + "</p>" +
        "</div>" +
        '<div class="contract-card-side">' +
        contractStatusBadge(contract.status) +
        '<p class="contract-amount">' + formatPrice(contract.amount) + "</p>" +
        "</div>" +
        "</div>";

    return card;
}

function renderContracts() {
    const container = document.getElementById("contractsList");
    const empty = document.getElementById("contractsEmpty");
    const cached = getCachedUser();

    if (!container || !cached) return;

    const filtered = contractsData.filter(function (contract) {
        if (currentTab === "client") return contract.clientId === cached.id;
        if (currentTab === "freelancer") return contract.freelancerId === cached.id;
        return true;
    });

    container.innerHTML = "";

    if (filtered.length === 0) {
        container.style.display = "none";
        if (empty) empty.style.display = "block";
        return;
    }

    container.style.display = "grid";
    if (empty) empty.style.display = "none";

    filtered.forEach(function (contract) {
        container.appendChild(buildContractCard(contract, cached));
    });
}

async function reloadContracts() {
    const data = await apiGetContracts();
    contractsData = data.contracts;
    renderContracts();
}

function initContracts() {
    setupNav("contracts");

    const bindTab = function (id, tab) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener("click", function () {
            currentTab = tab;
            document.querySelectorAll(".tab-btn").forEach(function (b) {
                b.classList.remove("active");
            });
            btn.classList.add("active");
            renderContracts();
        });
    };

    bindTab("allTab", "all");
    bindTab("clientTab", "client");
    bindTab("freelancerTab", "freelancer");

    reloadContracts().catch(function (error) {
        alert(error.message);
    });
}

document.addEventListener("DOMContentLoaded", initContracts);

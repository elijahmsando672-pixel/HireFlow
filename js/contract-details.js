let contract = null;
let currentUser = null;
let stepEls = [];

const STEPS = [
    { key: "hire", label: "Hire" },
    { key: "contract", label: "Contract" },
    { key: "payment", label: "Payment" },
    { key: "delivery", label: "Delivery" },
    { key: "review", label: "Review" }
];

function stepDone(key, status) {
    if (key === "hire" || key === "contract") return true;
    if (key === "payment") return ["Paid", "Delivered", "Completed"].indexOf(status) !== -1;
    if (key === "delivery") return ["Delivered", "Completed"].indexOf(status) !== -1;
    return status === "Completed";
}

function contractStatusBadge(status) {
    return '<span class="status-badge status-' + status.toLowerCase().replace(/\s/g, "-") + '">' + escapeHtml(status) + "</span>";
}

function renderSteps() {
    const container = document.getElementById("contractSteps");
    if (!container) return;

    container.innerHTML = "";

    STEPS.forEach(function (step, index) {
        const done = stepDone(step.key, contract.status);

        const node = document.createElement("div");
        node.className = "contract-step";

        node.innerHTML =
            '<div class="step-dot' + (done ? " done" : "") + '">' + (done ? "&#10003;" : index + 1) + "</div>" +
            '<span class="step-label">' + step.label + "</span>";

        container.appendChild(node);

        if (index < STEPS.length - 1) {
            const connector = document.createElement("div");
            connector.className = "step-connector" + (done ? " done" : "");
            container.appendChild(connector);
        }
    });
}

function openPayModal() {
    document.getElementById("payModal").style.display = "flex";
}

function closePayModal() {
    document.getElementById("payModal").style.display = "none";
}

function openDeliverModal() {
    document.getElementById("deliverModal").style.display = "flex";
}

function closeDeliverModal() {
    document.getElementById("deliverModal").style.display = "none";
}

function renderActions() {
    const container = document.getElementById("contractActions");
    if (!container) return;

    container.innerHTML = "";

    const isClient = contract.clientId === currentUser.id;
    const isFreelancer = contract.freelancerId === currentUser.id;
    const status = contract.status;

    const canPay = isClient && status === "Active" && !contract.payment;
    const canDeliver = isFreelancer && status === "Paid";
    const canComplete = isClient && status === "Delivered";
    const canCancel = ["Active", "Paid", "Delivered"].indexOf(status) !== -1;

    if (canPay) {
        const btn = document.createElement("button");
        btn.className = "btn btn-primary";
        btn.textContent = "Pay " + formatPrice(contract.amount);
        btn.addEventListener("click", openPayModal);
        container.appendChild(btn);
    }

    if (canDeliver) {
        const btn = document.createElement("button");
        btn.className = "btn btn-primary";
        btn.textContent = "Deliver work";
        btn.addEventListener("click", openDeliverModal);
        container.appendChild(btn);
    }

    if (canComplete) {
        const btn = document.createElement("button");
        btn.className = "btn btn-primary";
        btn.textContent = "Accept & complete";
        btn.addEventListener("click", async function () {
            if (!confirm("Accept this delivery and complete the contract? Payment will be released.")) return;
            try {
                await apiCompleteContract(contract.id);
                contract = (await apiGetContract(contract.id)).contract;
                renderContract();
            } catch (error) {
                alert(error.message);
            }
        });
        container.appendChild(btn);
    }

    if (canCancel) {
        const btn = document.createElement("button");
        btn.className = "btn btn-danger";
        btn.textContent = "Cancel contract";
        btn.addEventListener("click", async function () {
            if (!confirm("Cancel this contract? The proposal/order will be closed too.")) return;
            try {
                await apiCancelContract(contract.id);
                contract = (await apiGetContract(contract.id)).contract;
                renderContract();
            } catch (error) {
                alert(error.message);
            }
        });
        container.appendChild(btn);
    }
}

function renderNotice() {
    const container = document.getElementById("contractNotice");
    if (!container) return;
    container.innerHTML = "";

    if (contract.status === "Completed") {
        container.className = "notice notice-success";

        if (contract.orderId) {
            container.innerHTML =
                "<p><strong>Order complete.</strong> Leave a review for the freelancer.</p>" +
                '<a class="btn btn-outline btn-sm" href="my-orders.html">Review the order</a>';
        } else {
            container.innerHTML = "<p><strong>Contract complete.</strong> Payment released to the freelancer.</p>";
        }
    }
}

function renderDelivery() {
    const card = document.getElementById("deliveryCard");
    if (!card) return;

    if (!contract.deliveryNote) {
        card.style.display = "none";
        return;
    }

    card.style.display = "block";

    const meta = document.getElementById("deliveryMeta");
    if (meta) meta.textContent = "Delivered " + timeAgo(contract.deliveredAt || "");

    const note = document.getElementById("deliveryNote");
    if (note) {
        note.textContent = contract.deliveryNote;
    }
}

function renderParty() {
    const isClient = contract.clientId === currentUser.id;
    const party = isClient ? contract.freelancer : contract.client;

    const avatar = document.getElementById("partyAvatar");
    const name = document.getElementById("partyName");
    const role = document.getElementById("partyRole");
    const profile = document.getElementById("partyProfile");
    const message = document.getElementById("partyMessage");

    if (avatar) avatar.textContent = getUserInitials(party);
    if (name) name.textContent = party.firstName + " " + (party.lastName || "");
    if (role) role.textContent = isClient ? "Freelancer" : "Client";
    if (profile) profile.href = "profile.html?id=" + party.id;
    if (message) message.href = "messages.html?user=" + party.id;
}

function renderPayment() {
    const amount = document.getElementById("contractAmount");
    if (amount) amount.textContent = formatPrice(contract.amount);

    const info = document.getElementById("paymentInfo");
    if (!info) return;

    if (contract.payment) {
        info.className = "payment-info payment-paid";
        info.innerHTML =
            "<div class='payment-row'><span>Paid via</span><strong>" + escapeHtml(contract.payment.method) + "</strong></div>" +
            (contract.payment.reference
                ? "<div class='payment-row'><span>Reference</span><strong>" + escapeHtml(contract.payment.reference) + "</strong></div>"
                : "") +
            "<div class='payment-row'><span>Status</span>" + contractStatusBadge(contract.payment.status) + "</div>" +
            "<p class='muted' style='margin-top:8px;'>Paid " + timeAgo(contract.payment.paidAt || "") + " · held in escrow</p>";
    } else {
        info.className = "payment-info";
        info.innerHTML = "<p class='muted'>Awaiting payment.</p>";
    }
}

function renderContract() {
    const title = document.getElementById("contractTitle");
    const subtitle = document.getElementById("contractSubtitle");
    const status = document.getElementById("contractStatus");

    if (title) title.textContent = contract.title;
    if (subtitle) {
        const isClient = contract.clientId === currentUser.id;
        subtitle.textContent =
            (isClient ? "You are the client" : "You are the freelancer") + " · started " + timeAgo(contract.createdAt);
    }
    if (status) status.textContent = contract.status;
    status.className = "status-badge status-" + contract.status.toLowerCase().replace(/\s/g, "-");

    renderSteps();
    renderActions();
    renderNotice();
    renderDelivery();
    renderParty();
    renderPayment();
}

async function initContractDetails() {
    setupNav("contracts");

    const cached = getCachedUser();
    if (cached) currentUser = cached;

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"), 10);

    if (!id) {
        window.location.href = "contracts.html";
        return;
    }

    const modalClose = document.getElementById("payClose");
    const modalCancel = document.getElementById("payCancel");
    const paySubmit = document.getElementById("paySubmit");

    if (modalClose) modalClose.addEventListener("click", closePayModal);
    if (modalCancel) modalCancel.addEventListener("click", closePayModal);

    document.getElementById("payModal").addEventListener("click", function (event) {
        if (event.target === this) closePayModal();
    });

    if (paySubmit) {
        paySubmit.addEventListener("click", async function () {
            const method = document.getElementById("payMethod").value;
            const reference = document.getElementById("payRef").value;
            try {
                await apiPayContract(contract.id, method, reference);
                contract = (await apiGetContract(contract.id)).contract;
                closePayModal();
                renderContract();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    const deliverClose = document.getElementById("deliverClose");
    const deliverCancel = document.getElementById("deliverCancel");
    const deliverSubmit = document.getElementById("deliverSubmit");

    if (deliverClose) deliverClose.addEventListener("click", closeDeliverModal);
    if (deliverCancel) deliverCancel.addEventListener("click", closeDeliverModal);

    document.getElementById("deliverModal").addEventListener("click", function (event) {
        if (event.target === this) closeDeliverModal();
    });

    if (deliverSubmit) {
        deliverSubmit.addEventListener("click", async function () {
            const note = document.getElementById("deliveryText").value.trim();
            if (!note) {
                alert("Please add a delivery note.");
                return;
            }
            try {
                await apiDeliverContract(contract.id, note);
                contract = (await apiGetContract(contract.id)).contract;
                closeDeliverModal();
                renderContract();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    try {
        const data = await apiGetContract(id);
        contract = data.contract;
        const me = await apiGetMe();
        currentUser = me.user;
        cacheUser(me.user);
        renderContract();
    } catch (error) {
        alert(error.message);
        window.location.href = "contracts.html";
    }
}

document.addEventListener("DOMContentLoaded", initContractDetails);

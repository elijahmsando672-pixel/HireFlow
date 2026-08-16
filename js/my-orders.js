let ordersData = { buyer: [], seller: [] };
let currentTab = "buyer";

function orderStatusBadge(status) {
    return '<span class="status-badge status-' + status.toLowerCase().replace(/\s/g, "-") + '">' + status + "</span>";
}

function reviewFormHtml(orderId) {
    return '<div class="review-form" style="margin-top: 12px;">' +
        '<div class="star-picker" data-order="' + orderId + '">' +
        [1, 2, 3, 4, 5].map(function (n) {
            return '<button type="button" data-star="' + n + '">★</button>';
        }).join("") +
        "</div>" +
        '<div class="form-group" style="margin: 8px 0;">' +
        '<textarea rows="2" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; font-family: inherit; font-size: 14px;" placeholder="Leave a review..."></textarea>' +
        "</div>" +
        '<button class="btn btn-primary btn-sm submit-review" data-order="' + orderId + '">Submit Review</button>' +
        "</div>";
}

function buildOrderItem(order, role) {
    const item = document.createElement("div");
    item.className = "list-item";
    item.style.alignItems = "flex-start";

    const info = document.createElement("div");
    info.style.flex = "1";

    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.justifyContent = "space-between";
    head.style.gap = "12px";
    head.style.flexWrap = "wrap";

    const title = document.createElement("h4");
    title.textContent = order.gigTitle;

    const badgeWrap = document.createElement("div");
    badgeWrap.innerHTML = orderStatusBadge(order.status);

    head.appendChild(title);
    head.appendChild(badgeWrap);

    const meta = document.createElement("p");
    meta.className = "muted";

    const otherParty = role === "buyer"
        ? order.seller.firstName + " " + (order.seller.lastName || "")
        : order.buyer.firstName + " " + (order.buyer.lastName || "");

    const partyLabel = role === "buyer" ? "Seller" : "Buyer";

    meta.textContent = partyLabel + ": " + otherParty + " · " + formatPrice(order.price) + " · " + order.packageName + " · " + timeAgo(order.orderedAt);

    info.appendChild(head);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "list-item-actions";
    actions.style.marginTop = "8px";

    const message = document.createElement("a");
    message.className = "btn btn-outline btn-sm";
    message.href = "messages.html?user=" + (role === "buyer" ? order.seller.id : order.buyer.id);
    message.textContent = "Message";
    actions.appendChild(message);

    if (order.contractId) {
        const contractLink = document.createElement("a");
        contractLink.className = "btn btn-outline btn-sm";
        contractLink.href = "contract-details.html?id=" + order.contractId;
        contractLink.textContent = "Contract";
        actions.appendChild(contractLink);
    }

    if (order.status === "In Progress") {
        const completeBtn = document.createElement("button");
        completeBtn.className = "btn btn-primary btn-sm";
        completeBtn.textContent = "Mark Completed";
        completeBtn.addEventListener("click", async function () {
            try {
                await apiUpdateOrder(order.id, "Completed");
                await reloadOrders();
            } catch (error) {
                alert(error.message);
            }
        });
        actions.appendChild(completeBtn);

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "btn btn-danger btn-sm";
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", async function () {
            if (!confirm("Cancel this order?")) return;
            try {
                await apiUpdateOrder(order.id, "Cancelled");
                await reloadOrders();
            } catch (error) {
                alert(error.message);
            }
        });
        actions.appendChild(cancelBtn);
    }

    if (order.status === "Completed" && !order.reviewed) {
        const reviewWrap = document.createElement("div");
        reviewWrap.style.width = "100%";
        reviewWrap.style.marginTop = "10px";
        reviewWrap.innerHTML = reviewFormHtml(order.id);
        info.appendChild(reviewWrap);
    } else if (order.status === "Completed" && order.reviewed) {
        const done = document.createElement("span");
        done.className = "muted";
        done.style.display = "block";
        done.style.marginTop = "8px";
        done.textContent = "You reviewed this order.";
        info.appendChild(done);
    }

    item.appendChild(info);
    item.appendChild(actions);

    return item;
}

function renderOrders() {
    const container = document.getElementById("ordersList");
    const empty = document.getElementById("ordersEmpty");

    if (!container) return;

    const orders = currentTab === "buyer" ? ordersData.buyer : ordersData.seller;

    container.innerHTML = "";

    if (orders.length === 0) {
        container.style.display = "none";
        if (empty) empty.style.display = "block";
        return;
    }

    container.style.display = "block";
    if (empty) empty.style.display = "none";

    orders.forEach(function (order) {
        container.appendChild(buildOrderItem(order, currentTab));
    });

    initStarPickers();
}

async function reloadOrders() {
    const data = await apiGetMyOrders();
    ordersData = data;
    renderOrders();
}

function initStarPickers() {
    document.querySelectorAll(".star-picker").forEach(function (picker) {
        let rating = 0;

        picker.querySelectorAll("button").forEach(function (btn) {
            btn.addEventListener("click", function () {
                rating = parseInt(btn.getAttribute("data-star"), 10);

                picker.querySelectorAll("button").forEach(function (b) {
                    b.classList.toggle("selected", parseInt(b.getAttribute("data-star"), 10) <= rating);
                });
            });
        });

        const submitBtn = picker.parentElement.querySelector(".submit-review");

        if (submitBtn) {
            submitBtn.addEventListener("click", async function () {
                const orderId = parseInt(submitBtn.getAttribute("data-order"), 10);
                const comment = picker.parentElement.querySelector("textarea").value;

                if (!rating) {
                    alert("Please select a star rating.");
                    return;
                }

                try {
                    await apiCreateReview({
                        orderId: orderId,
                        rating: rating,
                        comment: comment
                    });
                    await reloadOrders();
                } catch (error) {
                    alert(error.message);
                }
            });
        }
    });
}

async function initMyOrders() {
    setupNav("gigs");

    const buyerTab = document.getElementById("buyerTab");
    const sellerTab = document.getElementById("sellerTab");

    if (buyerTab) {
        buyerTab.addEventListener("click", function () {
            currentTab = "buyer";
            buyerTab.classList.add("active");
            if (sellerTab) sellerTab.classList.remove("active");
            renderOrders();
        });
    }

    if (sellerTab) {
        sellerTab.addEventListener("click", function () {
            currentTab = "seller";
            sellerTab.classList.add("active");
            if (buyerTab) buyerTab.classList.remove("active");
            renderOrders();
        });
    }

    try {
        await reloadOrders();
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", initMyOrders);

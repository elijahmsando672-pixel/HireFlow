function renderGigDetail(gig, reviews) {
    const container = document.getElementById("gigDetail");
    if (!container) return;

    const ownGig = gig.userId === (getCachedUser() || {}).id;

    const packagesHtml = gig.packages.map(function (pkg) {
        const action = ownGig
            ? '<span class="muted">This is your gig</span>'
            : '<button class="btn btn-primary btn-block order-btn" data-package="' + escapeHtml(pkg.name) + '">Order Now</button>';

        return '<div class="package-card">' +
            '<span class="package-name">' + escapeHtml(pkg.name) + "</span>" +
            '<span class="package-desc">' + escapeHtml(pkg.description) + "</span>" +
            '<span class="package-delivery">&#128337; ' + pkg.deliveryDays + " day delivery</span>" +
            '<span class="package-price">' + formatPrice(pkg.price) + "</span>" +
            action +
            "</div>";
    }).join("");

    const reviewsHtml = reviews.length === 0
        ? ""
        : reviews.map(function (review) {
            return '<div class="review-item">' +
                '<div class="review-head">' +
                "<span class=\"muted\">" + escapeHtml(review.firstName) + " " + escapeHtml(review.lastName || "") + "</span>" +
                '<span class="review-stars">' + starRating(review.rating) + "</span>" +
                "</div>" +
                '<p class="review-comment">' + escapeHtml(review.comment) + "</p>" +
                "</div>";
        }).join("");

    const ratingBlock = gig.rating
        ? '<span class="review-stars">' + starRating(gig.rating) + " " + gig.rating + " (" + gig.reviewCount + " reviews)</span>"
        : '<span class="muted">No reviews yet</span>';

    container.innerHTML =
        '<div class="gig-detail-card">' +
        '<div class="gig-card-top">' +
        '<span class="badge badge-' + gig.category.toLowerCase() + '">' + escapeHtml(gig.category) + "</span>" +
        "</div>" +
        "<h1 style=\"margin-top: 12px;\">" + escapeHtml(gig.title) + "</h1>" +
        '<div class="gig-detail-meta">' +
        '<span class="gig-seller-avatar">' + getUserInitials(gig.seller) + "</span>" +
        "<span>" + escapeHtml(gig.seller.firstName) + " " + escapeHtml(gig.seller.lastName || "") + "</span>" +
        "<span>" + escapeHtml(gig.seller.headline || "Seller") + "</span>" +
        "</div>" +
        '<div style="margin-top: 6px;">' + ratingBlock + "</div>" +
        '<div class="gig-detail-section">' +
        "<h2>About this gig</h2>" +
        "<p>" + escapeHtml(gig.description) + "</p>" +
        "</div>" +
        '<div class="gig-detail-section">' +
        "<h2>Packages</h2>" +
        '<div class="package-grid">' + packagesHtml + "</div>" +
        "</div>" +
        (ownGig
            ? '<div class="gig-detail-section"><p class="empty-note">This is your gig. Track orders from <a href="my-orders.html">My Orders</a>.</p></div>'
            : '<div class="gig-detail-section" style="display: flex; gap: 10px; flex-wrap: wrap;">' +
              '<a href="messages.html?user=' + gig.userId + '" class="btn btn-outline">Message seller</a>' +
              "<a href=\"create-gig.html\" class=\"btn btn-outline\">Create your own gig</a>" +
              "</div>") +
        "</div>";

    document.querySelectorAll(".order-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            orderGig(gig, btn.getAttribute("data-package"), btn);
        });
    });

    const reviewsContainer = document.getElementById("reviewsList");
    const reviewsEmpty = document.getElementById("reviewsEmpty");

    if (reviewsContainer) reviewsContainer.innerHTML = reviewsHtml;
    if (reviewsEmpty) reviewsEmpty.style.display = reviews.length === 0 ? "block" : "none";
}

async function orderGig(gig, packageName, btn) {
    btn.disabled = true;

    try {
        await apiCreateOrder({ gigId: gig.id, packageName: packageName });
        window.location.href = "my-orders.html";
    } catch (error) {
        btn.disabled = false;
        alert(error.message);
    }
}

async function loadSaveState(gigId) {
    const saveBtn = document.getElementById("saveGigBtn");
    if (!saveBtn) return;

    try {
        const data = await apiGetSavedGigs();
        const saved = data.gigs.some(function (gig) {
            return gig.id === gigId;
        });

        if (saved) {
            saveBtn.classList.add("saved");
            saveBtn.textContent = "\u2605 Saved";
        }

        saveBtn.addEventListener("click", async function () {
            saveBtn.disabled = true;

            try {
                if (saveBtn.classList.contains("saved")) {
                    await apiUnsaveGig(gigId);
                    saveBtn.classList.remove("saved");
                    saveBtn.textContent = "\u2606 Save gig";
                } else {
                    await apiSaveGig(gigId);
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

async function initGigDetails() {
    setupNav("gigs");

    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get("id"), 10);

    try {
        const meData = await apiGetMe();
        cacheUser(meData.user);

        const data = await apiGetGig(id);
        renderGigDetail(data.gig, data.reviews);
        loadSaveState(data.gig.id);
    } catch (error) {
        if (error.message === "Gig not found.") {
            window.location.href = "gigs.html";
        } else {
            alert(error.message);
        }
    }
}

document.addEventListener("DOMContentLoaded", initGigDetails);

function buildMyGigCard(gig) {
    const card = document.createElement("div");
    card.className = "gig-card";

    const from = gig.packages.length ? gig.packages[0].price : 0;

    card.innerHTML =
        '<div class="gig-card-top">' +
        '<span class="badge badge-' + gig.category.toLowerCase() + '">' + escapeHtml(gig.category) + "</span>" +
        '<span class="gig-price">' + formatPrice(from) + "</span>" +
        "</div>" +
        "<h3 style=\"margin-top: 10px;\">" + escapeHtml(gig.title) + "</h3>" +
        '<div class="gig-rating">' +
        (gig.rating ? starRating(gig.rating) + " " + gig.rating + " (" + gig.reviewCount + " reviews)" : "No reviews yet") +
        "</div>" +
        '<div class="gig-card-foot">' +
        "<span class=\"muted\">" + gig.orderCount + " order" + (gig.orderCount === 1 ? "" : "s") + "</span>" +
        '<span class="list-item-actions">' +
        '<a class="btn btn-outline btn-sm" href="gig-details.html?id=' + gig.id + '">View</a>' +
        '<a class="btn btn-outline btn-sm" href="my-orders.html">Orders</a>' +
        "</span>" +
        "</div>";

    return card;
}

async function initMyGigs() {
    setupNav("gigs");

    try {
        const data = await apiGetMyGigs();
        const gigs = data.gigs;

        const grid = document.getElementById("myGigsGrid");
        const empty = document.getElementById("myGigsEmpty");

        if (!grid) return;

        grid.innerHTML = "";

        if (gigs.length === 0) {
            if (empty) empty.style.display = "block";
            return;
        }

        if (empty) empty.style.display = "none";

        gigs.forEach(function (gig) {
            grid.appendChild(buildMyGigCard(gig));
        });
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", initMyGigs);

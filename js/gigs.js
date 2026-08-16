const GIG_CATEGORIES = ["Design", "Software", "Writing", "Video", "Marketing", "Data", "Other"];

function populateGigCategoryFilter(selected) {
    const select = document.getElementById("gigCategory");
    if (!select) return;

    GIG_CATEGORIES.forEach(function (category) {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        option.selected = category === selected;
        select.appendChild(option);
    });
}

function buildGigCard(gig) {
    const card = document.createElement("a");
    card.className = "gig-card";
    card.href = "gig-details.html?id=" + gig.id;

    const from = gig.packages.length ? gig.packages[0].price : 0;

    card.innerHTML =
        '<div class="gig-card-top">' +
        '<span class="badge badge-' + gig.category.toLowerCase() + '">' + escapeHtml(gig.category) + "</span>" +
        "</div>" +
        "<h3 style=\"margin-top: 10px;\">" + escapeHtml(gig.title) + "</h3>" +
        '<div class="gig-seller">' +
        '<span class="gig-seller-avatar">' + getUserInitials(gig.seller) + "</span>" +
        "<span>" + escapeHtml(gig.seller.firstName) + " " + escapeHtml(gig.seller.lastName || "") + "</span>" +
        "</div>" +
        '<div class="gig-rating">' +
        (gig.rating ? starRating(gig.rating) + " " + gig.rating + " (" + gig.reviewCount + ")" : "No reviews yet") +
        "</div>" +
        '<div class="gig-card-foot">' +
        '<span class="gig-from">From</span>' +
        '<span class="gig-price">' + formatPrice(from) + "</span>" +
        "</div>";

    return card;
}

async function renderGigs() {
    const grid = document.getElementById("gigGrid");
    const empty = document.getElementById("gigEmptyState");
    const count = document.getElementById("gigResultsCount");

    if (!grid) return;

    const data = await apiGetGigs({
        search: document.getElementById("gigSearch").value,
        category: document.getElementById("gigCategory").value,
        sort: document.getElementById("gigSort").value
    });

    const gigs = data.gigs;

    grid.innerHTML = "";

    if (count) count.textContent = gigs.length;
    if (empty) empty.style.display = gigs.length === 0 ? "block" : "none";

    gigs.forEach(function (gig) {
        grid.appendChild(buildGigCard(gig));
    });
}

async function initGigs() {
    setupNav("gigs");

    populateGigCategoryFilter();

    try {
        await renderGigs();
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", initGigs);

const gigSearch = document.getElementById("gigSearch");
const gigCategory = document.getElementById("gigCategory");
const gigSort = document.getElementById("gigSort");

if (gigSearch) gigSearch.addEventListener("input", renderGigs);
if (gigCategory) gigCategory.addEventListener("change", renderGigs);
if (gigSort) gigSort.addEventListener("change", renderGigs);

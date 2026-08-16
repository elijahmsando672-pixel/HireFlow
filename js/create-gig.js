const PACKAGE_DEFAULTS = [
    { name: "Basic", price: "", description: "", deliveryDays: 3 },
    { name: "Standard", price: "", description: "", deliveryDays: 7 },
    { name: "Premium", price: "", description: "", deliveryDays: 14 }
];

function packageRowHtml(index, defaults) {
    return '<div class="package-form" data-index="' + index + '">' +
        '<div class="form-row-3">' +
        '<div class="form-group">' +
        '<label>Package name</label>' +
        '<input type="text" class="pkg-name" value="' + escapeHtml(defaults.name) + '">' +
        "</div>" +
        '<div class="form-group">' +
        "<label>Price (KSh)</label>" +
        '<input type="number" class="pkg-price" min="0" placeholder="e.g. 2000" value="' + defaults.price + '">' +
        "</div>" +
        '<div class="form-group">' +
        "<label>Delivery (days)</label>" +
        '<input type="number" class="pkg-days" min="1" value="' + defaults.deliveryDays + '">' +
        "</div>" +
        "</div>" +
        '<div class="form-group" style="margin-bottom: 0;">' +
        "<label>What's included?</label>" +
        '<input type="text" class="pkg-desc" placeholder="e.g. 1 logo concept, 2 revisions, PNG files" value="' + escapeHtml(defaults.description) + '">' +
        "</div>" +
        "</div>";
}

function initCreateGig() {
    setupNav("gigs");

    const rows = document.getElementById("packageRows");
    if (rows) {
        rows.innerHTML = PACKAGE_DEFAULTS.map(function (pkg, index) {
            return packageRowHtml(index, pkg);
        }).join("");
    }

    const submitBtn = document.getElementById("createGigBtn");
    const statusEl = document.getElementById("createGigStatus");

    if (!submitBtn) return;

    submitBtn.addEventListener("click", async function () {
        const title = document.getElementById("gigTitle").value;
        const description = document.getElementById("gigDescription").value;

        if (!title || !description) {
            statusEl.style.color = "#991b1b";
            statusEl.textContent = "Please provide a title and description.";
            return;
        }

        const packages = [];

        document.querySelectorAll(".package-form").forEach(function (row) {
            const name = row.querySelector(".pkg-name").value.trim();
            const price = parseInt(row.querySelector(".pkg-price").value, 10);
            const deliveryDays = parseInt(row.querySelector(".pkg-days").value, 10);
            const desc = row.querySelector(".pkg-desc").value.trim();

            if (name && price >= 0) {
                packages.push({
                    name: name,
                    price: price,
                    description: desc,
                    deliveryDays: deliveryDays
                });
            }
        });

        if (packages.length === 0) {
            statusEl.style.color = "#991b1b";
            statusEl.textContent = "Add at least one package with a price.";
            return;
        }

        submitBtn.disabled = true;
        statusEl.style.color = "#166534";

        try {
            await apiCreateGig({
                title: title,
                description: description,
                category: document.getElementById("gigCategory").value,
                packages: packages
            });

            statusEl.textContent = "Gig created! Redirecting...";
            window.location.href = "my-gigs.html";
        } catch (error) {
            submitBtn.disabled = false;
            statusEl.style.color = "#991b1b";
            statusEl.textContent = error.message;
        }
    });
}

document.addEventListener("DOMContentLoaded", initCreateGig);

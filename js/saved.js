let currentTab = "jobs";

function buildSavedJobItem(job) {
    const item = document.createElement("div");
    item.className = "list-item";

    const info = document.createElement("div");
    info.style.flex = "1";

    const title = document.createElement("h4");
    title.textContent = job.title;

    const meta = document.createElement("p");
    meta.className = "muted";
    meta.textContent = job.company + " · " + job.location + " · " + job.type + " · " + formatSalary(job.salary);

    info.appendChild(title);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "list-item-actions";

    const view = document.createElement("a");
    view.className = "btn btn-outline btn-sm";
    view.href = "job-details.html?id=" + job.id;
    view.textContent = "View";

    const remove = document.createElement("button");
    remove.className = "btn btn-danger btn-sm";
    remove.textContent = "Remove";

    remove.addEventListener("click", async function () {
        try {
            await apiUnsaveJob(job.id);
            await renderSaved();
        } catch (error) {
            alert(error.message);
        }
    });

    actions.appendChild(view);
    actions.appendChild(remove);

    item.appendChild(info);
    item.appendChild(actions);

    return item;
}

function buildSavedGigItem(gig) {
    const item = document.createElement("div");
    item.className = "list-item";

    const info = document.createElement("div");
    info.style.flex = "1";

    const title = document.createElement("h4");
    title.textContent = gig.title;

    const from = gig.packages.length ? gig.packages[0].price : 0;

    const meta = document.createElement("p");
    meta.className = "muted";
    meta.textContent = gig.seller.firstName + " " + (gig.seller.lastName || "") + " · From " + formatPrice(from) +
        (gig.rating ? " · " + gig.rating + "★ (" + gig.reviewCount + ")" : "");

    info.appendChild(title);
    info.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "list-item-actions";

    const view = document.createElement("a");
    view.className = "btn btn-outline btn-sm";
    view.href = "gig-details.html?id=" + gig.id;
    view.textContent = "View";

    const remove = document.createElement("button");
    remove.className = "btn btn-danger btn-sm";
    remove.textContent = "Remove";

    remove.addEventListener("click", async function () {
        try {
            await apiUnsaveGig(gig.id);
            await renderSaved();
        } catch (error) {
            alert(error.message);
        }
    });

    actions.appendChild(view);
    actions.appendChild(remove);

    item.appendChild(info);
    item.appendChild(actions);

    return item;
}

function emptySavedHtml() {
    return '<p class="empty-note">Nothing saved here yet. Use the star on any job or gig to bookmark it.</p>';
}

async function renderSaved() {
    const container = document.getElementById("savedList");
    if (!container) return;

    container.innerHTML = "";

    if (currentTab === "jobs") {
        const data = await apiGetSavedJobs();

        if (data.jobs.length === 0) {
            container.innerHTML = emptySavedHtml();
            return;
        }

        data.jobs.forEach(function (job) {
            container.appendChild(buildSavedJobItem(job));
        });
    } else {
        const data = await apiGetSavedGigs();

        if (data.gigs.length === 0) {
            container.innerHTML = emptySavedHtml();
            return;
        }

        data.gigs.forEach(function (gig) {
            container.appendChild(buildSavedGigItem(gig));
        });
    }
}

async function initSaved() {
    setupNav("dashboard");

    const jobsTab = document.getElementById("savedJobsTab");
    const gigsTab = document.getElementById("savedGigsTab");

    if (jobsTab) {
        jobsTab.addEventListener("click", function () {
            currentTab = "jobs";
            jobsTab.classList.add("active");
            if (gigsTab) gigsTab.classList.remove("active");
            renderSaved();
        });
    }

    if (gigsTab) {
        gigsTab.addEventListener("click", function () {
            currentTab = "gigs";
            gigsTab.classList.add("active");
            if (jobsTab) jobsTab.classList.remove("active");
            renderSaved();
        });
    }

    try {
        await renderSaved();
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", initSaved);

async function initPostJob() {
    setupNav("jobs");

    const submitBtn = document.getElementById("postJobBtn");
    const statusEl = document.getElementById("postJobStatus");

    if (!submitBtn) return;

    submitBtn.addEventListener("click", async function () {
        const title = document.getElementById("jobTitle").value;
        const description = document.getElementById("jobDescription").value;

        if (!title || !description) {
            statusEl.style.color = "#991b1b";
            statusEl.textContent = "Please provide a title and description.";
            return;
        }

        submitBtn.disabled = true;
        statusEl.style.color = "#166534";

        try {
            await apiPostJob({
                title: title,
                company: document.getElementById("jobCompany").value,
                location: document.getElementById("jobLocation").value,
                type: document.getElementById("jobType").value,
                category: document.getElementById("jobCategory").value,
                salary: parseInt(document.getElementById("jobSalary").value, 10) || 0,
                description: description,
                requirements: document.getElementById("jobRequirements").value
            });

            statusEl.textContent = "Job posted! Redirecting...";
            window.location.href = "my-jobs.html";
        } catch (error) {
            submitBtn.disabled = false;
            statusEl.style.color = "#991b1b";
            statusEl.textContent = error.message;
        }
    });
}

document.addEventListener("DOMContentLoaded", initPostJob);

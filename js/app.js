const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (email === "" || password === "") {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const data = await apiLogin({ email: email, password: password });

            setToken(data.token);
            cacheUser(data.user);

            window.location.href = "dashboard.html";
        } catch (error) {
            alert(error.message);
        }
    });
}


// =================================
// SIGN UP
// =================================

const signupForm = document.getElementById("signupForm");

if (signupForm) {

    const passwordInput =
        document.getElementById("signupPassword");

    const strengthBar =
        document.getElementById("strengthBar");

    const strengthText =
        document.getElementById("passwordStrengthText");


    // Password Strength
    passwordInput.addEventListener("input", function () {

        const password = passwordInput.value;

        let strength = 0;


        // Length
        if (password.length >= 8) {
            strength++;
        }

        // Lowercase
        if (/[a-z]/.test(password)) {
            strength++;
        }

        // Uppercase
        if (/[A-Z]/.test(password)) {
            strength++;
        }

        // Number
        if (/[0-9]/.test(password)) {
            strength++;
        }

        // Special character
        if (/[^A-Za-z0-9]/.test(password)) {
            strength++;
        }


        if (password.length === 0) {

            strengthBar.style.width = "0%";

            strengthText.textContent =
                "Password strength";

        }

        else if (strength <= 2) {

            strengthBar.style.width = "35%";

            strengthText.textContent =
                "Weak password";

        }

        else if (strength <= 4) {

            strengthBar.style.width = "70%";

            strengthText.textContent =
                "Medium password";

        }

        else {

            strengthBar.style.width = "100%";

            strengthText.textContent =
                "Strong password";

        }

    });


    // Submit Form
    signupForm.addEventListener("submit", async function (event) {

        event.preventDefault();


        const firstName =
            document.getElementById("firstName").value.trim();

        const lastName =
            document.getElementById("lastName").value.trim();

        const username =
            document.getElementById("username").value.trim();

        const email =
            document.getElementById("signupEmail").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const password =
            document.getElementById("signupPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const terms =
            document.getElementById("terms").checked;

        const roleInput =
            document.querySelector('input[name="role"]:checked');

        const role =
            roleInput ? roleInput.value : "both";


        // Check passwords
        if (password !== confirmPassword) {

            alert("Passwords do not match.");

            return;
        }


        // Check terms
        if (!terms) {

            alert(
                "Please agree to the Terms & Conditions."
            );

            return;
        }


        try {

            const data = await apiRegister({
                firstName: firstName,
                lastName: lastName,
                username: username,
                email: email,
                phone: phone,
                password: password,
                role: role
            });

            setToken(data.token);
            cacheUser(data.user);

            // Temporary success
            alert(
                `Account created successfully!\n\nWelcome ${firstName} ${lastName}!`
            );

            window.location.href = "registration.html";

        } catch (error) {
            alert(error.message);
        }

    });

}


// =================================
// SHOW / HIDE PASSWORD
// =================================

function togglePassword(inputId, button) {

    const input =
        document.getElementById(inputId);


    if (input.type === "password") {

        input.type = "text";

        button.textContent = "Hide";

    } else {

        input.type = "password";

        button.textContent = "Show";

    }

}


// =================================
// REGISTRATION
// =================================

const registrationForm =
    document.getElementById("registrationForm");


if (registrationForm) {

    registrationForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const agreement =
                document.getElementById(
                    "registrationAgreement"
                ).checked;


            if (!agreement) {

                alert(
                    "Please confirm that your information is accurate."
                );

                return;
            }


            const firstName =
                document.getElementById(
                    "regFirstName"
                ).value.trim();


            const lastName =
                document.getElementById(
                    "regLastName"
                ).value.trim();


            const email =
                document.getElementById(
                    "regEmail"
                ).value.trim();


            const phone =
                document.getElementById(
                    "regPhone"
                ).value.trim();


            const education =
                document.getElementById(
                    "educationLevel"
                ).value;


            const skills =
                document.getElementById(
                    "skills"
                ).value.trim();


            if (
                firstName === "" ||
                lastName === "" ||
                email === "" ||
                phone === "" ||
                education === "" ||
                skills === ""
            ) {

                alert(
                    "Please complete all required fields."
                );

                return;
            }


            try {

                const data = await apiUpdateProfile({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    phone: phone,
                    education: education
                });

                cacheUser(data.user);

                // Temporary success message

                alert(
                    "Registration completed successfully!"
                );

                // Move to Add Bio

                window.location.href =
                    "add-bio.html";

            } catch (error) {
                alert(error.message);
            }

        }
    );

}


// =================================
// ADD BIO
// =================================

const bioForm = document.getElementById("bioForm");

if (bioForm) {

    // Profile Picture Preview

    const profilePictureInput =
        document.getElementById("profilePicture");

    const profilePreview =
        document.getElementById("profilePreview");

    const profileImage =
        document.getElementById("profileImage");

    const profilePlaceholder =
        document.getElementById("profilePlaceholder");


    if (profilePictureInput && profilePreview) {

        profilePreview.addEventListener(
            "click",
            function () {
                profilePictureInput.click();
            }
        );

        profilePictureInput.addEventListener(
            "change",
            function (event) {

                const file = event.target.files[0];

                if (file) {

                    if (file.size > 5 * 1024 * 1024) {

                        alert("File size must be less than 5MB.");

                        profilePictureInput.value = "";

                        return;
                    }

                    const reader =
                        new FileReader();

                    reader.onload =
                        function (e) {

                            profileImage.src =
                                e.target.result;

                            profileImage.style.display =
                                "block";

                            profilePlaceholder.style.display =
                                "none";
                        };

                    reader.readAsDataURL(file);
                }
            }
        );
    }


    // Character Counters

    const headlineInput =
        document.getElementById("headline");

    const headlineCount =
        document.getElementById("headlineCount");

    const bioInput =
        document.getElementById("bio");

    const bioCount =
        document.getElementById("bioCount");


    if (headlineInput && headlineCount) {

        headlineInput.addEventListener(
            "input",
            function () {
                headlineCount.textContent =
                    this.value.length;
            }
        );
    }


    if (bioInput && bioCount) {

        bioInput.addEventListener(
            "input",
            function () {
                bioCount.textContent =
                    this.value.length;
            }
        );
    }


    // Skills Tags

    const skills = [];

    const skillInput =
        document.getElementById("skillInput");

    const addSkillBtn =
        document.getElementById("addSkillBtn");

    const skillsTagsContainer =
        document.getElementById("skillsTags");

    const skillsHiddenInput =
        document.getElementById("skillsHidden");


    function renderSkills() {

        if (!skillsTagsContainer) return;

        skillsTagsContainer.innerHTML = "";

        skills.forEach(function (skill, index) {

            const tag =
                document.createElement("span");

            tag.className = "skill-tag";

            tag.innerHTML =
                skill +
                ' <button type="button" data-index="' +
                index +
                '">&times;</button>';

            skillsTagsContainer.appendChild(tag);
        });


        if (skillsHiddenInput) {
            skillsHiddenInput.value =
                skills.join(",");
        }
    }


    function addSkill() {

        if (!skillInput) return;

        const skill =
            skillInput.value.trim();

        if (skill === "") {

            alert("Please enter a skill.");

            return;
        }

        if (skills.includes(skill)) {

            alert("This skill has already been added.");

            return;
        }

        skills.push(skill);

        skillInput.value = "";

        renderSkills();
    }


    if (addSkillBtn) {

        addSkillBtn.addEventListener(
            "click",
            addSkill
        );
    }


    if (skillInput) {

        skillInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    addSkill();
                }
            }
        );
    }


    if (skillsTagsContainer) {

        skillsTagsContainer.addEventListener(
            "click",
            function (event) {

                if (event.target.tagName === "BUTTON") {

                    const index =
                        parseInt(
                            event.target.getAttribute(
                                "data-index"
                            ),
                            10
                        );

                    skills.splice(index, 1);

                    renderSkills();
                }
            }
        );
    }


    // Interests Tags

    const interests = [];

    const interestInput =
        document.getElementById("interestInput");

    const addInterestBtn =
        document.getElementById("addInterestBtn");

    const interestsTagsContainer =
        document.getElementById("interestsTags");

    const interestsHiddenInput =
        document.getElementById("interestsHidden");


    function renderInterests() {

        if (!interestsTagsContainer) return;

        interestsTagsContainer.innerHTML = "";

        interests.forEach(function (interest, index) {

            const tag =
                document.createElement("span");

            tag.className = "skill-tag interest-tag";

            tag.innerHTML =
                interest +
                ' <button type="button" data-index="' +
                index +
                '">&times;</button>';

            interestsTagsContainer.appendChild(tag);
        });


        if (interestsHiddenInput) {
            interestsHiddenInput.value =
                interests.join(",");
        }
    }


    function addInterest() {

        if (!interestInput) return;

        const interest =
            interestInput.value.trim();

        if (interest === "") {

            alert("Please enter an interest.");

            return;
        }

        if (interests.includes(interest)) {

            alert("This interest has already been added.");

            return;
        }

        interests.push(interest);

        interestInput.value = "";

        renderInterests();
    }


    if (addInterestBtn) {

        addInterestBtn.addEventListener(
            "click",
            addInterest
        );
    }


    if (interestInput) {

        interestInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    addInterest();
                }
            }
        );
    }


    if (interestsTagsContainer) {

        interestsTagsContainer.addEventListener(
            "click",
            function (event) {

                if (event.target.tagName === "BUTTON") {

                    const index =
                        parseInt(
                            event.target.getAttribute(
                                "data-index"
                            ),
                            10
                        );

                    interests.splice(index, 1);

                    renderInterests();
                }
            }
        );
    }


    // Submit Bio Form

    bioForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const headline =
                document.getElementById("headline").value.trim();

            const bio =
                document.getElementById("bio").value.trim();

            const linkedin =
                document.getElementById("linkedin").value.trim();

            const github =
                document.getElementById("github").value.trim();

            const twitter =
                document.getElementById("twitter").value.trim();

            const portfolio =
                document.getElementById("portfolio").value.trim();


            if (headline === "" || bio === "") {

                alert(
                    "Please complete your headline and bio."
                );

                return;
            }


            try {

                const data = await apiUpdateProfile({
                    headline: headline,
                    bio: bio,
                    skills: skills,
                    interests: interests,
                    linkedin: linkedin,
                    github: github,
                    twitter: twitter,
                    portfolio: portfolio
                });

                cacheUser(data.user);

                // Temporary success

                alert("Bio added successfully!");

                // Move to Interview

                window.location.href =
                    "interview.html";

            } catch (error) {
                alert(error.message);
            }

        }
    );

}

import { API_URL, } from "./_types.js";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dukwtlvte/image/upload";
const CLOUDINARY_PRESET = "ml_default";
const CLOUDINARY_FOLDER = "cv-project/user-pictures";
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VALID_TLDS = /\.(com|org|net|edu|gov|ua|eu|io|dev|co)$/i;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("add-member-form");
    const submitBtn = document.getElementById("submit-btn");
    if (!form || !submitBtn)
        return;
    let isFormDirty = false;
    const val = (id) => document.getElementById(id)?.value.trim() || "";
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const emailError = document.getElementById("email-error");
    const phoneError = document.getElementById("phone-error");
    let validationFeedback = document.getElementById("form-validation-feedback");
    if (!validationFeedback) {
        validationFeedback = document.createElement("div");
        validationFeedback.id = "form-validation-feedback";
        validationFeedback.style.cssText = "color: #dc2626; font-size: 0.875rem; margin: 8px 0; display: none;";
        submitBtn.parentNode?.insertBefore(validationFeedback, submitBtn);
    }
    form.addEventListener("input", () => {
        isFormDirty = true;
        validateForm();
    });
    form.addEventListener("reset", () => {
        isFormDirty = false;
        if (validationFeedback)
            validationFeedback.style.display = "none";
        setTimeout(() => validateForm(), 0);
    });
    window.addEventListener("beforeunload", (e) => {
        if (isFormDirty) {
            e.preventDefault();
        }
    });
    async function checkBackendHealth() {
        try {
            const response = await fetch(`${API_URL}?skip=0&limit=1`);
            if (!response.ok)
                throw new Error("Backend connection failed");
        }
        catch (error) {
            console.error("Backend unavailable:", error);
            const errorBanner = document.createElement("div");
            errorBanner.className = "db-error-banner";
            errorBanner.innerHTML = "<strong>Warning!</strong> No connection to the database. Saving resumes is temporarily unavailable.";
            form?.parentNode?.insertBefore(errorBanner, form);
            Array.from(form?.elements || []).forEach((el) => {
                el.disabled = true;
            });
        }
    }
    checkBackendHealth();
    function isValidDateStr(dateStr) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr))
            return false;
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
    }
    function isFutureDate(dateStr) {
        return new Date(dateStr).getTime() > new Date().getTime();
    }
    function cleanDescription(text) {
        const trimmed = text.trim();
        return trimmed.length >= 10 ? trimmed : null;
    }
    function validateForm() {
        if (!submitBtn)
            return false;
        const errors = [];
        const firstName = val("first-name");
        const lastName = val("last-name");
        const preferredName = val("preferred-name");
        const nationality = val("nationality");
        const country = val("country");
        const birthDate = val("birth-date");
        if (!firstName || firstName.length > 20) {
            errors.push("First name is required (1 to 20 characters).");
        }
        if (!lastName || lastName.length > 20) {
            errors.push("Last name is required (1 to 20 characters).");
        }
        if (preferredName && preferredName.length > 20) {
            errors.push("Preferred name cannot exceed 20 characters.");
        }
        if (!nationality || nationality.length > 20) {
            errors.push("Enter a nationality (1 to 20 characters).");
        }
        if (!country || country.length > 30) {
            errors.push("Enter a country of residence (1 to 30 characters).");
        }
        if (!birthDate) {
            errors.push("Select a date of birth.");
        }
        else if (!isValidDateStr(birthDate) || isFutureDate(birthDate)) {
            errors.push("Date of birth is invalid or in the future.");
        }
        else {
            const birthYear = new Date(birthDate).getFullYear();
            const currentYear = new Date().getFullYear();
            if (currentYear - birthYear < 14) {
                errors.push("Age must be at least 14 years.");
            }
        }
        const emailVal = emailInput?.value.trim() || "";
        if (!EMAIL_REGEX.test(emailVal) || !VALID_TLDS.test(emailVal)) {
            if (emailError)
                emailError.textContent = "Invalid email format or domain.";
            errors.push("Invalid email address.");
        }
        else if (emailError) {
            emailError.textContent = "";
        }
        const phoneVal = phoneInput?.value.trim() || "";
        if (!PHONE_REGEX.test(phoneVal) || phoneVal.length < 10 || phoneVal.length > 15) {
            if (phoneError)
                phoneError.textContent = "Format: 10 to 15 characters (+380XXXXXXXXX).";
            errors.push("Invalid phone number.");
        }
        else if (phoneError) {
            phoneError.textContent = "";
        }
        const hoursRaw = val("device-hours");
        if (hoursRaw) {
            const h = parseFloat(hoursRaw);
            if (isNaN(h) || h < 0 || h > 168) {
                errors.push("Weekly availability must be between 0 and 168 hours.");
            }
        }
        const jobTitle = val("job-title");
        if (jobTitle) {
            if (jobTitle.length > 50)
                errors.push("Job title cannot exceed 50 characters.");
            const jobCompany = val("job-company");
            if (!jobCompany || jobCompany.length > 50)
                errors.push("Enter a company name (up to 50 characters).");
            const jobLoc = val("job-location");
            if (!jobLoc || jobLoc.length > 50)
                errors.push("Enter a work location (up to 50 characters).");
            const fromDate = val("job-from");
            const toDate = val("job-to");
            if (!fromDate || !isValidDateStr(fromDate)) {
                errors.push("Enter a valid work start date.");
            }
            if (toDate && (!isValidDateStr(toDate) || new Date(toDate) < new Date(fromDate))) {
                errors.push("The end date cannot be earlier than the start date.");
            }
            const jobDesc = val("job-desc");
            if (jobDesc && (jobDesc.length < 10 || jobDesc.length > 300)) {
                errors.push("Work description must be 10 to 300 characters (or left blank).");
            }
        }
        const sciName = val("sci-name");
        if (sciName) {
            if (sciName.length > 100)
                errors.push("Interest name: up to 100 characters.");
            const sciDesc = val("sci-desc");
            if (sciDesc && (sciDesc.length < 10 || sciDesc.length > 300)) {
                errors.push("Interest description must be 10 to 300 characters.");
            }
        }
        const pubTitle = val("pub-title");
        if (pubTitle) {
            if (pubTitle.length > 200)
                errors.push("Publication title: up to 200 characters.");
            const pubJournal = val("pub-journal");
            if (pubJournal && pubJournal.length > 100)
                errors.push("Publication journal: up to 100 characters.");
            const pubDate = val("pub-date");
            if (pubDate && (!isValidDateStr(pubDate) || isFutureDate(pubDate))) {
                errors.push("Publication date cannot be in the future.");
            }
        }
        const awardTitle = val("award-title");
        if (awardTitle) {
            if (awardTitle.length > 100)
                errors.push("Award title: up to 100 characters.");
            const awardOrg = val("award-org");
            if (awardOrg && awardOrg.length > 100)
                errors.push("Award organization: up to 100 characters.");
            const awardDate = val("award-date");
            if (awardDate && (!isValidDateStr(awardDate) || isFutureDate(awardDate))) {
                errors.push("Award date cannot be in the future.");
            }
        }
        if (validationFeedback) {
            if (errors.length > 0 && isFormDirty) {
                validationFeedback.textContent = errors[0];
                validationFeedback.style.display = "block";
            }
            else {
                validationFeedback.textContent = "";
                validationFeedback.style.display = "none";
            }
        }
        const isValid = errors.length === 0;
        submitBtn.disabled = !isValid;
        return isValid;
    }
    async function uploadPhoto(file) {
        if (!file.type.startsWith("image/")) {
            alert("The selected file is not an image.");
            return null;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("Photo size must not exceed 5 MB.");
            return null;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_PRESET);
        formData.append("folder", CLOUDINARY_FOLDER);
        try {
            const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
            if (!response.ok)
                return null;
            const data = await response.json();
            return data.secure_url || null;
        }
        catch (error) {
            console.error("Error uploading photo to Cloudinary:", error);
            return null;
        }
    }
    function buildRequestPayload(photoUrl) {
        const rawAuthors = val("pub-authors");
        const authors = rawAuthors ? rawAuthors.split(",").map(a => a.trim()).filter(Boolean) : [];
        const rawHobbies = val("hobbies");
        const hobbies = rawHobbies
            ? rawHobbies.split(",")
                .map(h => ({ name: h.trim().slice(0, 50) }))
                .filter(h => h.name.length > 0)
            : [];
        const hasJob = Boolean(val("job-title"));
        const workExperience = hasJob ? [{
                job_title: val("job-title").slice(0, 50),
                company: (val("job-company") || "Unknown").slice(0, 50),
                location: (val("job-location") || "Remote").slice(0, 50),
                from_date: val("job-from") || val("birth-date"),
                to_date: val("job-to") ? val("job-to") : null,
                description: cleanDescription(val("job-desc")),
            }] : [];
        const hasSci = Boolean(val("sci-name"));
        const scientificInterests = hasSci ? [{
                name: val("sci-name").slice(0, 100),
                description: cleanDescription(val("sci-desc")),
            }] : [];
        const hasPub = Boolean(val("pub-title"));
        const publications = hasPub ? [{
                title: val("pub-title").slice(0, 200),
                journal: val("pub-journal") ? val("pub-journal").slice(0, 100) : null,
                publication_date: val("pub-date") ? val("pub-date") : null,
                authors,
                url: null,
            }] : [];
        const hasAward = Boolean(val("award-title"));
        const awards = hasAward ? [{
                title: val("award-title").slice(0, 100),
                organization: val("award-org") ? val("award-org").slice(0, 100) : null,
                date: val("award-date") ? val("award-date") : null,
                description: null,
            }] : [];
        const hoursNum = parseFloat(val("device-hours"));
        const weeklyHours = (!isNaN(hoursNum) && hoursNum >= 0) ? hoursNum : 40.0;
        return {
            photo: photoUrl,
            personal_info: {
                first_name: val("first-name").slice(0, 20),
                last_name: val("last-name").slice(0, 20),
                preferred_name: val("preferred-name") ? val("preferred-name").slice(0, 20) : null,
                email: val("email"),
                phone: val("phone"),
                date_of_birth: val("birth-date"),
                nationality: val("nationality").slice(0, 20),
                country_of_residence: val("country").slice(0, 30),
                gender: (val("gender") || "other"),
            },
            languages: val("lang-name") ? [{
                    name: val("lang-name").slice(0, 30),
                    proficiency: (val("lang-level") || "intermediate"),
                }] : [],
            work_experience: workExperience,
            scientific_interests: scientificInterests,
            publications,
            awards,
            favorite_subjects_in_school: [(val("school-subject") || "computer_science")],
            programming_skills: val("prog-lang") ? [{
                    language: val("prog-lang").slice(0, 50),
                    level: (val("prog-level") || "intermediate"),
                }] : [],
            device_access: {
                weekly_hours: weeklyHours,
            },
            hobbies,
        };
    }
    async function submitToBackend(payload) {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errData = await response.json();
                console.error("FastAPI validation error (422):", errData);
                return false;
            }
            return true;
        }
        catch (err) {
            console.error("Network error while submitting:", err);
            return false;
        }
    }
    async function handleFormSubmit(e) {
        e.preventDefault();
        if (!validateForm() || !submitBtn || !form)
            return;
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";
        let photoUrl = null;
        const photoFileInput = document.getElementById("photo-file");
        if (photoFileInput?.files?.[0]) {
            photoUrl = await uploadPhoto(photoFileInput.files[0]);
        }
        const requestPayload = buildRequestPayload(photoUrl);
        const isSuccess = await submitToBackend(requestPayload);
        if (isSuccess) {
            isFormDirty = false;
            alert("Resume saved successfully!");
            form.reset();
        }
        else {
            alert("Could not save the resume. Check the browser console for error details.");
        }
        submitBtn.disabled = false;
        submitBtn.textContent = "Save resume";
    }
    form.addEventListener("submit", handleFormSubmit);
    validateForm();
});

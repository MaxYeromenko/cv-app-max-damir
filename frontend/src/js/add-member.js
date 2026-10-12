import { API_URL, } from "./_types.js";
import { getAdminApiHeaders } from "./_utils.js";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dukwtlvte/image/upload";
const CLOUDINARY_PRESET = "ml_default";
const CLOUDINARY_FOLDER = "cv-project/user-pictures";
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("add-member-form");
    const submitBtn = document.getElementById("submit-btn");
    if (!form || !submitBtn)
        return;
    let isFormDirty = false;
    const cvId = new URLSearchParams(window.location.search).get("id");
    let existingPhotoUrl = null;
    const val = (id) => document.getElementById(id)?.value.trim() || "";
    const setVal = (id, value) => {
        const field = document.getElementById(id);
        if (field)
            field.value = value || "";
    };
    const sectionDefinitions = {
        programmingSkills: { containerId: "programming-skills-list", templateId: "programming-skill-template" },
        languages: { containerId: "languages-list", templateId: "language-template" },
        workExperience: { containerId: "work-experience-list", templateId: "work-experience-template" },
        scientificInterests: { containerId: "scientific-interests-list", templateId: "scientific-interest-template" },
        publications: { containerId: "publications-list", templateId: "publication-template" },
        awards: { containerId: "awards-list", templateId: "award-template" },
        subjects: { containerId: "subjects-list", templateId: "subject-template" },
    };
    let repeatItemCount = 0;
    function getSectionItems(key) {
        const container = document.getElementById(sectionDefinitions[key].containerId);
        return container ? Array.from(container.querySelectorAll("[data-repeat-item]")) : [];
    }
    function getItemValue(item, field) {
        return item.querySelector(`[data-field="${field}"]`)?.value.trim() || "";
    }
    function setItemValues(item, values) {
        for (const [field, value] of Object.entries(values)) {
            const control = item.querySelector(`[data-field="${field}"]`);
            if (control)
                control.value = value || "";
        }
    }
    function addSectionItem(key, values = {}) {
        const definition = sectionDefinitions[key];
        const container = document.getElementById(definition.containerId);
        const template = document.getElementById(definition.templateId);
        const item = template?.content.firstElementChild?.cloneNode(true);
        if (!container || !item)
            return;
        repeatItemCount += 1;
        item.querySelectorAll("[data-field]").forEach((control) => {
            const field = control.dataset.field;
            if (!field)
                return;
            control.id = `repeat-${key}-${repeatItemCount}-${field}`;
            const label = control.closest(".form-group")?.querySelector("label");
            if (label)
                label.htmlFor = control.id;
        });
        setItemValues(item, values);
        item.querySelector(".remove-repeat-item")?.addEventListener("click", () => {
            item.remove();
            isFormDirty = true;
            validateForm();
        });
        item.addEventListener("input", () => {
            isFormDirty = true;
            validateForm();
        });
        item.addEventListener("change", () => {
            isFormDirty = true;
            validateForm();
        });
        container.appendChild(item);
    }
    function resetRepeatableSections() {
        for (const key of Object.keys(sectionDefinitions)) {
            const container = document.getElementById(sectionDefinitions[key].containerId);
            if (container)
                container.replaceChildren();
            addSectionItem(key);
        }
    }
    for (const key of Object.keys(sectionDefinitions)) {
        addSectionItem(key);
    }
    document.querySelectorAll("[data-add]").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.dataset.add;
            if (!(key in sectionDefinitions))
                return;
            addSectionItem(key);
            isFormDirty = true;
        });
    });
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
        setTimeout(() => {
            resetRepeatableSections();
            existingPhotoUrl = null;
            validateForm();
        }, 0);
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
    void checkBackendHealth();
    function populateForm(cv) {
        const info = cv.personal_info;
        setVal("first-name", info.first_name);
        setVal("last-name", info.last_name);
        setVal("preferred-name", info.preferred_name);
        setVal("gender", info.gender);
        setVal("birth-date", info.date_of_birth);
        setVal("nationality", info.nationality);
        setVal("country", info.country_of_residence);
        setVal("email", info.email);
        setVal("phone", info.phone);
        setVal("device-hours", String(cv.device_access.weekly_hours));
        setVal("hobbies", cv.hobbies.map((hobby) => hobby.name).join(", "));
        existingPhotoUrl = cv.photo || null;
        const populateSection = (key, entries) => {
            const container = document.getElementById(sectionDefinitions[key].containerId);
            if (container)
                container.replaceChildren();
            if (entries.length)
                entries.forEach((entry) => addSectionItem(key, entry));
            else
                addSectionItem(key);
        };
        populateSection("programmingSkills", cv.programming_skills.map((skill) => ({
            language: skill.language,
            level: skill.level,
        })));
        populateSection("languages", cv.languages.map((language) => ({
            name: language.name,
            proficiency: language.proficiency,
        })));
        populateSection("workExperience", cv.work_experience.map((job) => ({
            job_title: job.job_title,
            company: job.company,
            location: job.location,
            from_date: job.from_date,
            to_date: job.to_date,
            description: job.description,
        })));
        populateSection("scientificInterests", cv.scientific_interests.map((interest) => ({
            name: interest.name,
            description: interest.description,
        })));
        populateSection("publications", cv.publications.map((publication) => ({
            ...publication,
            authors: publication.authors.join(", "),
        })));
        populateSection("awards", cv.awards.map((award) => ({
            ...award,
        })));
        populateSection("subjects", cv.favorite_subjects_in_school.map((subject) => ({ subject })));
    }
    async function loadCvForEditing() {
        const title = document.getElementById("form-title");
        const description = document.getElementById("form-description");
        if (title)
            title.textContent = "Edit member's CV";
        if (description)
            description.textContent = "Update the CV details and save your changes.";
        if (submitBtn) {
            submitBtn.textContent = "Update CV";
            submitBtn.disabled = true;
        }
        try {
            const response = await fetch(`${API_URL}/${encodeURIComponent(cvId || "")}`);
            if (!response.ok) {
                const details = await response.text();
                throw new Error(`HTTP ${response.status}: ${details || response.statusText}`);
            }
            const cv = await response.json();
            populateForm(cv);
            isFormDirty = false;
            validateForm();
        }
        catch (error) {
            console.error("Error loading CV for editing:", error);
            if (validationFeedback) {
                validationFeedback.textContent = `Could not load this CV. ${error instanceof Error ? error.message : "Please try again."}`;
                validationFeedback.style.display = "block";
            }
            if (submitBtn)
                submitBtn.disabled = true;
        }
    }
    if (cvId)
        void loadCvForEditing();
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
            const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
            const today = new Date();
            let age = today.getFullYear() - birthYear;
            if (today.getMonth() + 1 < birthMonth ||
                (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)) {
                age -= 1;
            }
            if (age < 14) {
                errors.push("Age must be at least 14 years.");
            }
        }
        const emailVal = emailInput?.value.trim() || "";
        if (!emailVal || emailInput?.validity.typeMismatch) {
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
        const weeklyHours = Number(hoursRaw);
        if (!hoursRaw) {
            errors.push("Enter weekly availability.");
        }
        else if (!Number.isFinite(weeklyHours) || weeklyHours < 0 || weeklyHours > 168) {
            errors.push("Weekly availability must be between 0 and 168 hours.");
        }
        const enteredData = (item) => Array.from(item.querySelectorAll("input, textarea"))
            .some((control) => control.value.trim() !== "") ||
            Boolean(item.querySelector('[data-field="subject"]')?.value);
        const validateSection = (key, primaryField, primaryLabel, validateEntry) => {
            for (const item of getSectionItems(key)) {
                if (!enteredData(item))
                    continue;
                if (!getItemValue(item, primaryField)) {
                    errors.push(`${primaryLabel} is required for each started entry.`);
                    continue;
                }
                validateEntry(item);
            }
        };
        validateSection("programmingSkills", "language", "Programming language", (item) => {
            if (getItemValue(item, "language").length > 50)
                errors.push("Programming language cannot exceed 50 characters.");
        });
        validateSection("languages", "name", "Language name", (item) => {
            if (getItemValue(item, "name").length > 30)
                errors.push("Language name cannot exceed 30 characters.");
        });
        validateSection("workExperience", "job_title", "Position", (item) => {
            const company = getItemValue(item, "company");
            const location = getItemValue(item, "location");
            const fromDate = getItemValue(item, "from_date");
            const toDate = getItemValue(item, "to_date");
            const description = getItemValue(item, "description");
            if (getItemValue(item, "job_title").length > 50)
                errors.push("Job title cannot exceed 50 characters.");
            if (!company || company.length > 50)
                errors.push("Enter a company name (up to 50 characters).");
            if (!location || location.length > 50)
                errors.push("Enter a work location (up to 50 characters).");
            if (!fromDate || !isValidDateStr(fromDate))
                errors.push("Enter a valid work start date.");
            if (toDate && (!isValidDateStr(toDate) || new Date(toDate) < new Date(fromDate))) {
                errors.push("The end date cannot be earlier than the start date.");
            }
            if (description && (description.length < 10 || description.length > 300)) {
                errors.push("Work description must be 10 to 300 characters (or left blank).");
            }
        });
        validateSection("scientificInterests", "name", "Scientific interest", (item) => {
            const name = getItemValue(item, "name");
            const description = getItemValue(item, "description");
            if (name.length > 100)
                errors.push("Interest name cannot exceed 100 characters.");
            if (description && (description.length < 10 || description.length > 300)) {
                errors.push("Interest description must be 10 to 300 characters (or left blank).");
            }
        });
        validateSection("publications", "title", "Publication title", (item) => {
            const title = getItemValue(item, "title");
            const journal = getItemValue(item, "journal");
            const date = getItemValue(item, "publication_date");
            if (title.length > 200)
                errors.push("Publication title cannot exceed 200 characters.");
            if (journal.length > 100)
                errors.push("Publication journal cannot exceed 100 characters.");
            if (date && (!isValidDateStr(date) || isFutureDate(date))) {
                errors.push("Publication date cannot be in the future.");
            }
        });
        validateSection("awards", "title", "Award title", (item) => {
            const title = getItemValue(item, "title");
            const organization = getItemValue(item, "organization");
            const date = getItemValue(item, "date");
            const description = getItemValue(item, "description");
            if (title.length > 100)
                errors.push("Award title cannot exceed 100 characters.");
            if (organization.length > 100)
                errors.push("Award organization cannot exceed 100 characters.");
            if (date && (!isValidDateStr(date) || isFutureDate(date))) {
                errors.push("Award date cannot be in the future.");
            }
            if (description && (description.length < 10 || description.length > 300)) {
                errors.push("Award description must be 10 to 300 characters (or left blank).");
            }
        });
        validateSection("subjects", "subject", "Favourite subject", () => undefined);
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
        const rawHobbies = val("hobbies");
        const hobbies = rawHobbies
            ? rawHobbies.split(",")
                .map(h => ({ name: h.trim().slice(0, 50) }))
                .filter(h => h.name.length > 0)
            : [];
        const programmingSkills = getSectionItems("programmingSkills")
            .filter((item) => getItemValue(item, "language"))
            .map((item) => ({
            language: getItemValue(item, "language").slice(0, 50),
            level: (getItemValue(item, "level") || "intermediate"),
        }));
        const languages = getSectionItems("languages")
            .filter((item) => getItemValue(item, "name"))
            .map((item) => ({
            name: getItemValue(item, "name").slice(0, 30),
            proficiency: (getItemValue(item, "proficiency") || "intermediate"),
        }));
        const workExperience = getSectionItems("workExperience")
            .filter((item) => getItemValue(item, "job_title"))
            .map((item) => ({
            job_title: getItemValue(item, "job_title").slice(0, 50),
            company: getItemValue(item, "company").slice(0, 50),
            location: getItemValue(item, "location").slice(0, 50),
            from_date: getItemValue(item, "from_date"),
            to_date: getItemValue(item, "to_date") || null,
            description: cleanDescription(getItemValue(item, "description")),
        }));
        const scientificInterests = getSectionItems("scientificInterests")
            .filter((item) => getItemValue(item, "name"))
            .map((item) => ({
            name: getItemValue(item, "name").slice(0, 100),
            description: cleanDescription(getItemValue(item, "description")),
        }));
        const publications = getSectionItems("publications")
            .filter((item) => getItemValue(item, "title"))
            .map((item) => {
            const rawAuthors = getItemValue(item, "authors");
            return {
                title: getItemValue(item, "title").slice(0, 200),
                journal: getItemValue(item, "journal").slice(0, 100) || null,
                publication_date: getItemValue(item, "publication_date") || null,
                authors: rawAuthors ? rawAuthors.split(",").map((author) => author.trim()).filter(Boolean) : [],
                url: getItemValue(item, "url") || null,
            };
        });
        const awards = getSectionItems("awards")
            .filter((item) => getItemValue(item, "title"))
            .map((item) => ({
            title: getItemValue(item, "title").slice(0, 100),
            organization: getItemValue(item, "organization").slice(0, 100) || null,
            date: getItemValue(item, "date") || null,
            description: cleanDescription(getItemValue(item, "description")),
        }));
        const subjects = getSectionItems("subjects")
            .map((item) => getItemValue(item, "subject"))
            .filter(Boolean);
        const weeklyHours = Number(val("device-hours"));
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
            languages,
            work_experience: workExperience,
            scientific_interests: scientificInterests,
            publications,
            awards,
            favorite_subjects_in_school: [...new Set(subjects)],
            programming_skills: programmingSkills,
            device_access: {
                weekly_hours: weeklyHours,
            },
            hobbies,
        };
    }
    async function submitToBackend(payload) {
        const response = await fetch(cvId ? `${API_URL}/${encodeURIComponent(cvId)}` : API_URL, {
            method: cvId ? "PUT" : "POST",
            headers: { "Content-Type": "application/json", ...getAdminApiHeaders() },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const details = await response.text();
            throw new Error(`HTTP ${response.status}: ${details || response.statusText}`);
        }
    }
    async function handleFormSubmit(e) {
        e.preventDefault();
        if (!validateForm() || !submitBtn || !form)
            return;
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";
        let photoUrl = existingPhotoUrl;
        const photoFileInput = document.getElementById("photo-file");
        if (photoFileInput?.files?.[0]) {
            photoUrl = await uploadPhoto(photoFileInput.files[0]);
            if (!photoUrl) {
                submitBtn.disabled = false;
                submitBtn.textContent = cvId ? "Update CV" : "Save CV";
                window.alert("The photo could not be uploaded. The CV was not saved.");
                return;
            }
        }
        const requestPayload = buildRequestPayload(photoUrl);
        try {
            await submitToBackend(requestPayload);
            isFormDirty = false;
            if (cvId) {
                window.location.assign(`/member.html?id=${encodeURIComponent(cvId)}`);
                return;
            }
            window.alert("CV created successfully.");
            form.reset();
        }
        catch (error) {
            console.error("Error saving CV:", error);
            window.alert(`Could not save the CV. ${error instanceof Error ? error.message : "Please try again."}`);
        }
        submitBtn.disabled = false;
        submitBtn.textContent = cvId ? "Update CV" : "Save CV";
        validateForm();
    }
    form.addEventListener("submit", handleFormSubmit);
    validateForm();
});

"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("add-member-form");
    const submitBtn = document.getElementById("submit-btn");
    const val = (id) => document.getElementById(id)?.value.trim() || "";
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const emailError = document.getElementById("email-error");
    const phoneError = document.getElementById("phone-error");
    const validTlds = /\.(com|org|net|edu|gov|ua|eu|io|dev|co)$/i;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^\+380\d{9}$/;
    function validateForm() {
        let isValid = true;
        if (!val("first-name") || !val("last-name") || !val("birth-date") || !val("nationality") || !val("country")) {
            isValid = false;
        }
        const emailVal = emailInput.value.trim();
        if (!emailRegex.test(emailVal) || !validTlds.test(emailVal)) {
            emailError.textContent = "Невірний формат email або домен.";
            isValid = false;
        }
        else {
            emailError.textContent = "";
        }
        const phoneVal = phoneInput.value.trim();
        if (!phoneRegex.test(phoneVal)) {
            phoneError.textContent = "Телефон має бути у форматі +380XXXXXXXXX.";
            isValid = false;
        }
        else {
            phoneError.textContent = "";
        }
        submitBtn.disabled = !isValid;
    }
    form.addEventListener("input", validateForm);
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        let photoUrl = null;
        const photoFileInput = document.getElementById("photo-file");
        if (photoFileInput.files && photoFileInput.files[0]) {
            const file = photoFileInput.files[0];
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", "ml_default");
            formData.append("folder", "cv-project/user-pictures");
            try {
                const cloudinaryResponse = await fetch("https://api.cloudinary.com/v1_1/dukwtlvte/image/upload", { method: "POST", body: formData });
                const cloudinaryData = await cloudinaryResponse.json();
                photoUrl = cloudinaryData.secure_url || null;
            }
            catch (error) {
                console.error("Помилка завантаження фото в Cloudinary:", error);
            }
        }
        const languages = val("lang-name") ? [{
                name: val("lang-name"),
                proficiency: val("lang-level")
            }] : [];
        const programming_skills = val("prog-lang") ? [{
                language: val("prog-lang"),
                level: val("prog-level")
            }] : [];
        const work_experience = val("job-title") ? [{
                job_title: val("job-title"),
                company: val("job-company") || "Unknown",
                location: val("job-location") || "Unknown",
                from_date: val("job-from") || val("birth-date"),
                to_date: val("job-to") || null,
                description: val("job-desc") || null
            }] : [];
        const scientific_interests = val("sci-name") ? [{
                name: val("sci-name"),
                description: val("sci-desc") || null
            }] : [];
        const publications = val("pub-title") ? [{
                title: val("pub-title"),
                journal: val("pub-journal") || null,
                publication_date: val("pub-date") || null,
                authors: val("pub-authors") ? val("pub-authors").split(",").map(a => a.trim()) : [],
                url: null
            }] : [];
        const awards = val("award-title") ? [{
                title: val("award-title"),
                organization: val("award-org") || null,
                date: val("award-date") || null,
                description: null
            }] : [];
        const hobbies = val("hobbies")
            ? val("hobbies").split(",").map(h => ({ name: h.trim() })).filter(h => h.name)
            : [];
        const requestPayload = {
            photo: photoUrl,
            personal_info: {
                first_name: val("first-name"),
                last_name: val("last-name"),
                preferred_name: val("preferred-name") || null,
                email: val("email"),
                phone: val("phone"),
                date_of_birth: val("birth-date"),
                nationality: val("nationality"),
                country_of_residence: val("country"),
                gender: val("gender")
            },
            languages: languages,
            work_experience: work_experience,
            scientific_interests: scientific_interests,
            publications: publications,
            awards: awards,
            favorite_subjects_in_school: [val("school-subject")],
            programming_skills: programming_skills,
            device_access: {
                weekly_hours: Number(val("device-hours")) || 40
            },
            hobbies: hobbies
        };
        try {
            const response = await fetch("http://localhost:8000/api/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestPayload),
            });
            if (response.ok) {
                alert("Резюме успішно збережено на сервері!");
                form.reset();
                submitBtn.disabled = true;
            }
            else {
                const errData = await response.json();
                console.error("Помилка валідації FastAPI:", errData);
                alert("Помилка при збереженні (перевір консоль браузера).");
            }
        }
        catch (err) {
            console.error("Мережева помилка:", err);
            alert("Помилка з'єднання із сервером.");
        }
    });
});

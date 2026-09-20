const API_URL = "http://localhost:8000/api/v1/user-cv";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dukwtlvte/image/upload";
const CLOUDINARY_PRESET = "ml_default";
const CLOUDINARY_FOLDER = "cv-project/user-pictures";
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
    async function checkBackendHealth() {
        try {
            const response = await fetch(`${API_URL}?skip=0&limit=1`);
            if (!response.ok)
                throw new Error("Сервер повернув помилку");
        }
        catch (error) {
            console.error("Бекенд недоступний:", error);
            const errorBanner = document.createElement("div");
            errorBanner.className = "db-error-banner";
            errorBanner.innerHTML = "<strong>Увага!</strong> Немає зв'язку з базою даних. Збереження резюме тимчасово недоступне.";
            form.parentNode?.insertBefore(errorBanner, form);
            Array.from(form.elements).forEach((el) => {
                el.disabled = true;
            });
        }
    }
    checkBackendHealth();
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
            phoneError.textContent = "Формат телефону має бути +380XXXXXXXXX.";
            isValid = false;
        }
        else {
            phoneError.textContent = "";
        }
        submitBtn.disabled = !isValid;
    }
    async function uploadPhoto(file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_PRESET);
        formData.append("folder", CLOUDINARY_FOLDER);
        try {
            const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
            const data = await response.json();
            return data.secure_url || null;
        }
        catch (error) {
            console.error("Cloudinary upload error:", error);
            return null;
        }
    }
    function buildRequestPayload(photoUrl) {
        return {
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
                gender: (val("gender") || "other")
            },
            languages: val("lang-name") ? [{
                    name: val("lang-name"),
                    proficiency: (val("lang-level") || "intermediate")
                }] : [],
            work_experience: val("job-title") ? [{
                    job_title: val("job-title"),
                    company: val("job-company") || "Unknown",
                    location: val("job-location") || "Unknown",
                    from_date: val("job-from") || val("birth-date"),
                    to_date: val("job-to") || null,
                    description: val("job-desc") || null
                }] : [],
            scientific_interests: val("sci-name") ? [{
                    name: val("sci-name"),
                    description: val("sci-desc") || null
                }] : [],
            publications: val("pub-title") ? [{
                    title: val("pub-title"),
                    journal: val("pub-journal") || null,
                    publication_date: val("pub-date") || null,
                    authors: val("pub-authors") ? val("pub-authors").split(",").map(a => a.trim()) : [],
                    url: null
                }] : [],
            awards: val("award-title") ? [{
                    title: val("award-title"),
                    organization: val("award-org") || null,
                    date: val("award-date") || null,
                    description: null
                }] : [],
            favorite_subjects_in_school: [(val("school-subject") || "computer_science")],
            programming_skills: val("prog-lang") ? [{
                    language: val("prog-lang"),
                    level: (val("prog-level") || "intermediate")
                }] : [],
            device_access: {
                weekly_hours: Number(val("device-hours")) || 40
            },
            hobbies: val("hobbies")
                ? val("hobbies").split(",").map(h => ({ name: h.trim() })).filter(h => h.name)
                : []
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
                console.error("FastAPI validation error:", errData);
                return false;
            }
            return true;
        }
        catch (err) {
            console.error("Network error:", err);
            return false;
        }
    }
    async function handleFormSubmit(e) {
        e.preventDefault();
        submitBtn.disabled = true;
        let photoUrl = null;
        const photoFileInput = document.getElementById("photo-file");
        if (photoFileInput.files && photoFileInput.files[0]) {
            photoUrl = await uploadPhoto(photoFileInput.files[0]);
        }
        const requestPayload = buildRequestPayload(photoUrl);
        const isSuccess = await submitToBackend(requestPayload);
        if (isSuccess) {
            alert("CV successfully saved to the server!");
            form.reset();
        }
        else {
            alert("Failed to save CV. Check browser console for details.");
            submitBtn.disabled = false;
        }
    }
    form.addEventListener("input", validateForm);
    form.addEventListener("submit", handleFormSubmit);
});
export {};

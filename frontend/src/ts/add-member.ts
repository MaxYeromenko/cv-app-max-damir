import {
    UserCVRequest,
    API_URL,
    Gender,
    ProficiencyLevel,
    ProgrammingLevel,
    SchoolSubject,
} from "./_types.js";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dukwtlvte/image/upload";
const CLOUDINARY_PRESET = "ml_default";
const CLOUDINARY_FOLDER = "cv-project/user-pictures";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const VALID_TLDS = /\.(com|org|net|edu|gov|ua|eu|io|dev|co)$/i;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("add-member-form") as HTMLFormElement | null;
    const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement | null;

    if (!form || !submitBtn) return;

    let isFormDirty = false;

    const val = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value.trim() || "";

    const emailInput = document.getElementById("email") as HTMLInputElement | null;
    const phoneInput = document.getElementById("phone") as HTMLInputElement | null;
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
        if (validationFeedback) validationFeedback.style.display = "none";
        setTimeout(() => validateForm(), 0);
    });

    window.addEventListener("beforeunload", (e: BeforeUnloadEvent) => {
        if (isFormDirty) {
            e.preventDefault();
        }
    });

    async function checkBackendHealth(): Promise<void> {
        try {
            const response = await fetch(`${API_URL}?skip=0&limit=1`);
            if (!response.ok) throw new Error("Помилка зв'язку з бекендом");
        } catch (error) {
            console.error("Бекенд недоступний:", error);

            const errorBanner = document.createElement("div");
            errorBanner.className = "db-error-banner";
            errorBanner.innerHTML = "<strong>Увага!</strong> Немає зв'язку з базою даних. Збереження резюме тимчасово недоступне.";
            form?.parentNode?.insertBefore(errorBanner, form);

            Array.from(form?.elements || []).forEach((el) => {
                (el as HTMLInputElement).disabled = true;
            });
        }
    }

    checkBackendHealth();

    function isValidDateStr(dateStr: string): boolean {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateStr;
    }

    function isFutureDate(dateStr: string): boolean {
        return new Date(dateStr).getTime() > new Date().getTime();
    }

    function cleanDescription(text: string): string | null {
        const trimmed = text.trim();
        return trimmed.length >= 10 ? trimmed : null;
    }

    function validateForm(): boolean {
        if (!submitBtn) return false;

        const errors: string[] = [];

        const firstName = val("first-name");
        const lastName = val("last-name");
        const preferredName = val("preferred-name");
        const nationality = val("nationality");
        const country = val("country");
        const birthDate = val("birth-date");

        if (!firstName || firstName.length > 20) {
            errors.push("Ім'я обов'язкове (від 1 до 20 символів).");
        }
        if (!lastName || lastName.length > 20) {
            errors.push("Прізвище обов'язкове (від 1 до 20 символів).");
        }
        if (preferredName && preferredName.length > 20) {
            errors.push("Бажане ім'я не може перевищувати 20 символів.");
        }
        if (!nationality || nationality.length > 20) {
            errors.push("Вкажіть національність (від 1 до 20 символів).");
        }
        if (!country || country.length > 30) {
            errors.push("Вкажіть країну проживання (від 1 до 30 символів).");
        }

        if (!birthDate) {
            errors.push("Оберіть дату народження.");
        } else if (!isValidDateStr(birthDate) || isFutureDate(birthDate)) {
            errors.push("Дата народження некоректна або вказана в майбутньому.");
        } else {
            const birthYear = new Date(birthDate).getFullYear();
            const currentYear = new Date().getFullYear();
            if (currentYear - birthYear < 14) {
                errors.push("Вік повинен бути не менше 14 років.");
            }
        }

        const emailVal = emailInput?.value.trim() || "";
        if (!EMAIL_REGEX.test(emailVal) || !VALID_TLDS.test(emailVal)) {
            if (emailError) emailError.textContent = "Невірний формат email або домен.";
            errors.push("Некоректний email.");
        } else if (emailError) {
            emailError.textContent = "";
        }

        const phoneVal = phoneInput?.value.trim() || "";
        if (!PHONE_REGEX.test(phoneVal) || phoneVal.length < 10 || phoneVal.length > 15) {
            if (phoneError) phoneError.textContent = "Формат: від 10 до 15 символів (+380XXXXXXXXX).";
            errors.push("Некоректний номер телефону.");
        } else if (phoneError) {
            phoneError.textContent = "";
        }

        const hoursRaw = val("device-hours");
        if (hoursRaw) {
            const h = parseFloat(hoursRaw);
            if (isNaN(h) || h < 0 || h > 168) {
                errors.push("Години доступності мають бути від 0 до 168 на тиждень.");
            }
        }

        const jobTitle = val("job-title");
        if (jobTitle) {
            if (jobTitle.length > 50) errors.push("Посада має бути до 50 символів.");
            const jobCompany = val("job-company");
            if (!jobCompany || jobCompany.length > 50) errors.push("Вкажіть компанію (до 50 символів).");
            const jobLoc = val("job-location");
            if (!jobLoc || jobLoc.length > 50) errors.push("Вкажіть локацію роботи (до 50 символів).");

            const fromDate = val("job-from");
            const toDate = val("job-to");

            if (!fromDate || !isValidDateStr(fromDate)) {
                errors.push("Вкажіть коректну дату початку роботи.");
            }
            if (toDate && (!isValidDateStr(toDate) || new Date(toDate) < new Date(fromDate))) {
                errors.push("Дата завершення роботи не може бути ранішою за дату початку.");
            }

            const jobDesc = val("job-desc");
            if (jobDesc && (jobDesc.length < 10 || jobDesc.length > 300)) {
                errors.push("Опис роботи повинен містити від 10 до 300 символів (або залиште порожнім).");
            }
        }

        const sciName = val("sci-name");
        if (sciName) {
            if (sciName.length > 100) errors.push("Назва інтересу: максимум 100 символів.");
            const sciDesc = val("sci-desc");
            if (sciDesc && (sciDesc.length < 10 || sciDesc.length > 300)) {
                errors.push("Опис інтересу повинен містити від 10 до 300 символів.");
            }
        }

        const pubTitle = val("pub-title");
        if (pubTitle) {
            if (pubTitle.length > 200) errors.push("Назва публікації: максимум 200 символів.");
            const pubJournal = val("pub-journal");
            if (pubJournal && pubJournal.length > 100) errors.push("Журнал публікації: максимум 100 символів.");
            const pubDate = val("pub-date");
            if (pubDate && (!isValidDateStr(pubDate) || isFutureDate(pubDate))) {
                errors.push("Дата публікації не може бути в майбутньому.");
            }
        }

        const awardTitle = val("award-title");
        if (awardTitle) {
            if (awardTitle.length > 100) errors.push("Назва нагороди: максимум 100 символів.");
            const awardOrg = val("award-org");
            if (awardOrg && awardOrg.length > 100) errors.push("Організація нагороди: максимум 100 символів.");
            const awardDate = val("award-date");
            if (awardDate && (!isValidDateStr(awardDate) || isFutureDate(awardDate))) {
                errors.push("Дата нагороди не може бути в майбутньому.");
            }
        }

        if (validationFeedback) {
            if (errors.length > 0 && isFormDirty) {
                validationFeedback.textContent = errors[0];
                validationFeedback.style.display = "block";
            } else {
                validationFeedback.textContent = "";
                validationFeedback.style.display = "none";
            }
        }

        const isValid = errors.length === 0;
        submitBtn.disabled = !isValid;
        return isValid;
    }

    async function uploadPhoto(file: File): Promise<string | null> {
        if (!file.type.startsWith("image/")) {
            alert("Вибраний файл не є зображенням.");
            return null;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("Розмір фото не повинен перевищувати 5 МБ.");
            return null;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_PRESET);
        formData.append("folder", CLOUDINARY_FOLDER);

        try {
            const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
            if (!response.ok) return null;
            const data = await response.json();
            return data.secure_url || null;
        } catch (error) {
            console.error("Помилка завантаження фото в Cloudinary:", error);
            return null;
        }
    }

    function buildRequestPayload(photoUrl: string | null): UserCVRequest {
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
            location: (val("job-location") || "Віддалено").slice(0, 50),
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
                gender: (val("gender") || "other") as Gender,
            },
            languages: val("lang-name") ? [{
                name: val("lang-name").slice(0, 30),
                proficiency: (val("lang-level") || "intermediate") as ProficiencyLevel,
            }] : [],
            work_experience: workExperience,
            scientific_interests: scientificInterests,
            publications,
            awards,
            favorite_subjects_in_school: [(val("school-subject") || "computer_science") as SchoolSubject],
            programming_skills: val("prog-lang") ? [{
                language: val("prog-lang").slice(0, 50),
                level: (val("prog-level") || "intermediate") as ProgrammingLevel,
            }] : [],
            device_access: {
                weekly_hours: weeklyHours,
            },
            hobbies,
        };
    }

    async function submitToBackend(payload: UserCVRequest): Promise<boolean> {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error("FastAPI помилка валідації (422):", errData);
                return false;
            }
            return true;
        } catch (err) {
            console.error("Мережева помилка відправки:", err);
            return false;
        }
    }

    async function handleFormSubmit(e: Event): Promise<void> {
        e.preventDefault();

        if (!validateForm() || !submitBtn || !form) return;

        submitBtn.disabled = true;
        submitBtn.textContent = "Збереження...";

        let photoUrl: string | null = null;
        const photoFileInput = document.getElementById("photo-file") as HTMLInputElement | null;

        if (photoFileInput?.files?.[0]) {
            photoUrl = await uploadPhoto(photoFileInput.files[0]);
        }

        const requestPayload = buildRequestPayload(photoUrl);
        const isSuccess = await submitToBackend(requestPayload);

        if (isSuccess) {
            isFormDirty = false;
            alert("Резюме успішно збережено!");
            form.reset();
        } else {
            alert("Не вдалося зберегти резюме. Деталі помилки перевірте в консолі браузера.");
        }

        submitBtn.disabled = false;
        submitBtn.textContent = "Зберегти резюме";
    }

    form.addEventListener("submit", handleFormSubmit);
    validateForm();
});
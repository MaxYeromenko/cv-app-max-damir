import { API_URL, FALLBACK_PHOTO, GENDER_LABELS, PROFICIENCY_LABELS, PROGRAMMING_LEVEL_LABELS, SUBJECT_LABELS, } from "./_types.js";
import { escapeHtml, setElementText } from "./_utils.js";
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const cvId = urlParams.get("id");
    const statusContainer = document.querySelector(".status-container");
    const loadingState = document.getElementById("loading-state");
    const errorState = document.getElementById("error-state");
    const cvDocument = document.getElementById("cv-document");
    const exportBtn = document.getElementById("export-pdf-btn");
    if (!cvId) {
        showError("ID резюме не вказано в URL.");
        return;
    }
    exportBtn?.addEventListener("click", () => window.print());
    async function loadMemberData() {
        try {
            const response = await fetch(`${API_URL}/${cvId}`);
            if (!response.ok)
                throw new Error("Резюме не знайдено");
            const cvData = await response.json();
            populateDOM(cvData);
            statusContainer?.classList.add("hidden");
            cvDocument?.classList.remove("hidden");
            if (exportBtn)
                exportBtn.disabled = false;
        }
        catch (error) {
            console.error(error);
            showError();
        }
    }
    function showError(msg) {
        loadingState?.classList.add("hidden");
        errorState?.classList.remove("hidden");
        if (errorState && msg) {
            errorState.innerHTML = `<strong>Помилка:</strong> ${escapeHtml(msg)}`;
        }
    }
    function renderList(containerId, items, renderFn, emptyMsg = "Немає даних") {
        const container = document.getElementById(containerId);
        if (!container)
            return;
        if (!items || items.length === 0) {
            container.innerHTML = `<li class="fadedText">${escapeHtml(emptyMsg)}</li>`;
            return;
        }
        container.innerHTML = items.map(renderFn).join("");
    }
    function renderCommaList(containerId, items, formatFn, emptyMsg = "Немає даних") {
        const container = document.getElementById(containerId);
        if (!container)
            return;
        if (!items || items.length === 0) {
            container.textContent = emptyMsg;
            container.classList.add("fadedText");
            return;
        }
        container.classList.remove("fadedText");
        container.textContent = items.map(formatFn).join(", ");
    }
    function populateDOM(cv) {
        const pInfo = cv.personal_info;
        const photoEl = document.getElementById("cv-photo");
        if (photoEl) {
            photoEl.src = cv.photo || FALLBACK_PHOTO;
            photoEl.onerror = () => { photoEl.src = FALLBACK_PHOTO; };
        }
        setElementText("cv-name", `${pInfo.first_name} ${pInfo.last_name}`);
        setElementText("cv-preferred-name", pInfo.preferred_name ? `(Також відомий як: ${pInfo.preferred_name})` : "");
        setElementText("cv-role", cv.work_experience?.[0]?.job_title || "Кандидат / Студент");
        const emailEl = document.getElementById("cv-email");
        if (emailEl) {
            emailEl.href = `mailto:${pInfo.email}`;
            emailEl.textContent = pInfo.email;
        }
        const phoneEl = document.getElementById("cv-phone");
        if (phoneEl) {
            phoneEl.href = `tel:${pInfo.phone}`;
            phoneEl.textContent = pInfo.phone;
        }
        const dobEl = document.getElementById("cv-dob");
        if (dobEl) {
            dobEl.dateTime = pInfo.date_of_birth;
            dobEl.textContent = pInfo.date_of_birth;
        }
        setElementText("cv-location", `${pInfo.country_of_residence} (${pInfo.nationality})`);
        setElementText("cv-gender", GENDER_LABELS[pInfo.gender] || pInfo.gender);
        setElementText("cv-hours", cv.device_access?.weekly_hours ? `${cv.device_access.weekly_hours} год/тижд` : "Гнучкий графік");
        renderList("cv-languages", cv.languages, (lang) => {
            const level = PROFICIENCY_LABELS[lang.proficiency] || lang.proficiency;
            return `<li><strong>${escapeHtml(lang.name)}:</strong> ${escapeHtml(level)}</li>`;
        });
        renderCommaList("cv-hobbies", cv.hobbies, (hobby) => hobby.name);
        renderCommaList("cv-programming-skills", cv.programming_skills, (skill) => {
            const level = PROGRAMMING_LEVEL_LABELS[skill.level] || skill.level;
            return `${skill.language} (${level})`;
        });
        renderList("cv-experience", cv.work_experience, (job) => `
            <li class="item">
                <h4>${escapeHtml(job.job_title)} в ${escapeHtml(job.company)}</h4>
                <div class="meta">
                    <time datetime="${escapeHtml(job.from_date)}">${escapeHtml(job.from_date)}</time> — 
                    ${job.to_date ? `<time datetime="${escapeHtml(job.to_date)}">${escapeHtml(job.to_date)}</time>` : "Нині"} | ${escapeHtml(job.location || "Віддалено")}
                </div>
                ${job.description ? `<p>${escapeHtml(job.description)}</p>` : ""}
            </li>
        `);
        renderCommaList("cv-subjects", cv.favorite_subjects_in_school, (sub) => {
            return SUBJECT_LABELS[sub] || sub;
        });
        const scienceContainer = document.getElementById("cv-science");
        if (scienceContainer) {
            const parts = [];
            if (cv.scientific_interests?.length) {
                const interestsHtml = cv.scientific_interests.map(i => `
                    <li>
                        <strong>${escapeHtml(i.name)}</strong>
                        ${i.description ? `<p>${escapeHtml(i.description)}</p>` : ""}
                    </li>
                `).join("");
                parts.push(`<li class="item"><h4>Інтереси:</h4><ul class="sub-list">${interestsHtml}</ul></li>`);
            }
            if (cv.publications?.length) {
                const pubsHtml = cv.publications.map(p => `
                    <li>
                        <strong>${escapeHtml(p.title)}</strong>
                        <div class="meta">
                            <time datetime="${escapeHtml(p.publication_date || "")}">${escapeHtml(p.publication_date || "Дата не вказана")}</time>
                            ${p.journal ? `— <em>${escapeHtml(p.journal)}</em>` : ""}
                        </div>
                    </li>
                `).join("");
                parts.push(`<li class="item"><h4>Публікації:</h4><ul class="sub-list">${pubsHtml}</ul></li>`);
            }
            scienceContainer.innerHTML = parts.join("") || '<li class="fadedText">Немає даних</li>';
        }
        renderList("cv-awards", cv.awards, (award) => `
            <li class="item">
                <h4>${escapeHtml(award.title)}</h4>
                <div class="meta">
                    ${escapeHtml(award.organization || "")} | 
                    ${award.date ? `<time datetime="${escapeHtml(award.date)}">${escapeHtml(award.date)}</time>` : ""}
                </div>
                ${award.description ? `<p>${escapeHtml(award.description)}</p>` : ""}
            </li>
        `);
    }
    loadMemberData();
});

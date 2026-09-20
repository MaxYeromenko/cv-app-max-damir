import {
    UserCV,
    ApiResponse,
    ProficiencyLevel,
    ProgrammingLevel,
    PROFICIENCY_LABELS,
    PROGRAMMING_LEVEL_LABELS,
} from "./_types.js";

const API_URL = "http://localhost:8000/api/v1/user-cv";
const ITEMS_PER_PAGE = 5;
const FALLBACK_PHOTO = "./public/cv.svg";

const DUMMY_MEMBERS: UserCV[] = [
    {
        id: "fallback-1",
        photo: null,
        personal_info: {
            first_name: "Максим",
            last_name: "Петренко",
            email: "m.petrenko@example.com",
            phone: "+380501234567",
            date_of_birth: "2003-05-14",
            nationality: "Україна",
            country_of_residence: "Україна",
            gender: "male"
        },
        languages: [{ name: "Англійська", proficiency: "upper_intermediate" }],
        programming_skills: [
            { language: "TypeScript", level: "advanced" },
            { language: "JavaScript", level: "advanced" }
        ],
        work_experience: [{
            job_title: "Frontend Developer",
            company: "Tech Solutions",
            from_date: "2023-01-10"
        }],
        favorite_subjects_in_school: ["computer_science", "mathematics"],
        device_access: { weekly_hours: 40 },
        scientific_interests: [],
        publications: [],
        awards: [],
        hobbies: [{ name: "Стрімінг" }]
    },
    {
        id: "fallback-2",
        photo: null,
        personal_info: {
            first_name: "Дамір",
            last_name: "Іванов",
            email: "d.ivanov@example.com",
            phone: "+380671234567",
            date_of_birth: "2003-11-20",
            nationality: "Україна",
            country_of_residence: "Україна",
            gender: "male"
        },
        languages: [{ name: "Англійська", proficiency: "advanced" }],
        programming_skills: [
            { language: "Python", level: "expert" },
            { language: "C++", level: "advanced" }
        ],
        work_experience: [{
            job_title: "Backend Developer",
            company: "Data Corp",
            from_date: "2022-05-15"
        }],
        favorite_subjects_in_school: ["physics", "computer_science"],
        device_access: { weekly_hours: 35 },
        scientific_interests: [],
        publications: [],
        awards: [],
        hobbies: []
    }
];

document.addEventListener("DOMContentLoaded", () => {
    const catalogContent = document.querySelector(".catalog-content") as HTMLElement;
    const paginationNav = catalogContent?.querySelector(".pagination") as HTMLElement;
    const paginationNumbers = document.getElementById("pagination-numbers") as HTMLElement;
    const prevPageBtn = document.getElementById("prev-page") as HTMLButtonElement;
    const nextPageBtn = document.getElementById("next-page") as HTMLButtonElement;

    const filtersForm = document.getElementById("filters-form") as HTMLFormElement;
    const searchInput = document.getElementById("filter-search") as HTMLInputElement;
    const progLangSelect = document.getElementById("filter-prog-lang") as HTMLSelectElement;
    const progLevelSelect = document.getElementById("filter-prog-level") as HTMLSelectElement;
    const subjectSelect = document.getElementById("filter-subject") as HTMLSelectElement;
    const hoursInput = document.getElementById("filter-hours") as HTMLInputElement;
    const hoursValueSpan = document.getElementById("hours-value") as HTMLElement;

    let allMembers: UserCV[] = [];
    let filteredMembers: UserCV[] = [];
    let currentPage = 1;
    let isDbError = false;

    async function fetchMembersData(): Promise<{ items: UserCV[], error: boolean }> {
        try {
            const response = await fetch(`${API_URL}?skip=0&limit=100`);
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            const data: ApiResponse = await response.json();
            return { items: data.items || [], error: false };
        } catch (error) {
            console.error("Error fetching data from the database:", error);
            return { items: [], error: true };
        }
    }

    function createRowElement(cv: UserCV): HTMLDivElement {
        const row = document.createElement("div");
        row.className = "catalog-row";

        const location = cv.personal_info?.country_of_residence || cv.personal_info?.nationality || "Україна";
        const email = cv.personal_info?.email || "—";
        const phone = cv.personal_info?.phone || "—";
        const hours = cv.device_access?.weekly_hours ? `${cv.device_access.weekly_hours} год/тиждень` : "Гнучкий графік";
        const fullName = `${cv.personal_info?.first_name || ""} ${cv.personal_info?.last_name || ""}`.trim() || "Без імені";
        const role = cv.work_experience?.[0]?.job_title || "IT Спеціаліст";
        const photoSrc = cv.photo || FALLBACK_PHOTO;

        const langs = (cv.languages || []).map((l) => {
            const formattedLevel = PROFICIENCY_LABELS[l.proficiency as ProficiencyLevel] || l.proficiency;
            return `${l.name} — ${formattedLevel}`;
        }).join(", ") || "Українська";

        const badgesHtml = (cv.programming_skills || []).slice(0, 3).map((s) => {
            const levelLabel = PROGRAMMING_LEVEL_LABELS[s.level as ProgrammingLevel] || s.level;
            return `<span class="badge">${s.language} · ${levelLabel}</span>`;
        }).join("");

        row.innerHTML = `
            <div class="row-meta">
                <p><strong>Локація:</strong> ${location}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Телефон:</strong> ${phone}</p>
                <p><strong>Доступність:</strong> ${hours}</p>
                <p><strong>Мови:</strong> ${langs}</p>
            </div>
            <article class="row-main">
                <div class="card-avatar">
                    <img src="${photoSrc}" alt="${fullName}" onerror="this.src='${FALLBACK_PHOTO}'" />
                </div>
                <div class="card-info">
                    <h3>${fullName}</h3>
                    <p class="fadedText">${role}</p>
                    <div class="card-badges">
                        ${badgesHtml || '<span class="badge">Стек не вказано</span>'}
                    </div>
                </div>
                <a href="/member.html?id=${cv.id}" class="cta-button" rel="noopener noreferrer">Переглянути профіль</a>
            </article>
        `;
        return row;
    }

    function renderCatalog(): void {
        if (!catalogContent || !paginationNav) return;

        catalogContent.querySelectorAll(".catalog-row, .empty-state, .db-error-banner").forEach((el) => el.remove());

        if (isDbError) {
            const errorBanner = document.createElement("div");
            errorBanner.className = "db-error-banner";
            errorBanner.innerHTML = "<strong>Увага!</strong> Немає зв'язку з базою даних. Показано демонстраційні картки (заглушки).";
            catalogContent.insertBefore(errorBanner, paginationNav);
        }

        if (filteredMembers.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";
            emptyState.innerHTML = `<p class="fadedText">За вашим запитом жодного резюме не знайдено.</p>`;

            catalogContent.insertBefore(emptyState, paginationNav);
            updatePaginationUI(0);
            return;
        }

        const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageItems = filteredMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        pageItems.forEach((cv) => {
            const rowElement = createRowElement(cv);
            catalogContent.insertBefore(rowElement, paginationNav);
        });

        updatePaginationUI(totalPages);
    }

    function updatePaginationUI(totalPages: number): void {
        if (!paginationNumbers) return;
        paginationNumbers.innerHTML = "";

        if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1 || totalPages === 0;
        if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;

        for (let i = 1; i <= totalPages; i++) {
            const numBtn = document.createElement("button");
            numBtn.className = `pagination-num cta-button ${i === currentPage ? "active" : ""}`;
            numBtn.textContent = String(i);
            numBtn.addEventListener("click", () => handlePageChange(i));
            paginationNumbers.appendChild(numBtn);
        }
    }

    function handlePageChange(page: number): void {
        currentPage = page;
        renderCatalog();
        catalogContent.scrollIntoView({ behavior: "smooth" });
    }

    function applyFilters(): void {
        const query = searchInput.value.trim().toLowerCase();
        const selectedLang = progLangSelect.value.trim().toLowerCase();
        const selectedLevel = progLevelSelect.value.trim().toLowerCase();
        const selectedSubject = subjectSelect.value.trim();
        const minHours = Number(hoursInput.value) || 0;

        filteredMembers = allMembers.filter((cv) => {
            const fullName = `${cv.personal_info?.first_name || ""} ${cv.personal_info?.last_name || ""}`.toLowerCase();
            const preferred = (cv.personal_info?.preferred_name || "").toLowerCase();
            const role = (cv.work_experience?.[0]?.job_title || "").toLowerCase();

            const matchesSearch = !query || fullName.includes(query) || preferred.includes(query) || role.includes(query);
            const matchesLang = !selectedLang || (cv.programming_skills || []).some((s) => s.language.toLowerCase() === selectedLang);
            const matchesLevel = !selectedLevel || (cv.programming_skills || []).some((s) => s.level.toLowerCase() === selectedLevel);
            const matchesSubject = !selectedSubject || (cv.favorite_subjects_in_school || []).includes(selectedSubject as any);
            const matchesHours = (cv.device_access?.weekly_hours ?? 0) >= minHours;

            return matchesSearch && matchesLang && matchesLevel && matchesSubject && matchesHours;
        });

        currentPage = 1;
        renderCatalog();
    }

    async function init() {
        hoursInput?.addEventListener("input", () => {
            if (hoursValueSpan) hoursValueSpan.textContent = `${hoursInput.value} год`;
        });

        filtersForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            applyFilters();
        });

        filtersForm?.addEventListener("reset", () => {
            setTimeout(() => {
                if (hoursValueSpan) hoursValueSpan.textContent = "0 год";
                filteredMembers = [...allMembers];
                currentPage = 1;
                renderCatalog();
            }, 0);
        });

        prevPageBtn?.addEventListener("click", () => {
            if (currentPage > 1) handlePageChange(currentPage - 1);
        });

        nextPageBtn?.addEventListener("click", () => {
            const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
            if (currentPage < totalPages) handlePageChange(currentPage + 1);
        });

        const fetchResult = await fetchMembersData();

        if (fetchResult.error) {
            isDbError = true;
            allMembers = DUMMY_MEMBERS;
        } else {
            isDbError = false;
            allMembers = fetchResult.items;
        }

        filteredMembers = [...allMembers];
        renderCatalog();
    }

    init();
});
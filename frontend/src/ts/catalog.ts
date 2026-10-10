import {
    UserCV,
    ApiResponse,
    API_URL,
    FALLBACK_PHOTO,
    ProficiencyLevel,
    ProgrammingLevel,
    SchoolSubject,
    PROFICIENCY_LABELS,
    PROGRAMMING_LEVEL_LABELS,
} from "./_types.js";
import { escapeHtml, getAdminApiHeaders } from "./_utils.js";

const ITEMS_PER_PAGE = 5;

document.addEventListener("DOMContentLoaded", () => {
    const catalogContent = document.querySelector(".catalog-content") as HTMLElement | null;
    const paginationNav = catalogContent?.querySelector(".pagination") as HTMLElement | null;
    const paginationNumbers = document.getElementById("pagination-numbers");
    const prevPageBtn = document.getElementById("prev-page") as HTMLButtonElement | null;
    const nextPageBtn = document.getElementById("next-page") as HTMLButtonElement | null;

    const filtersForm = document.getElementById("filters-form") as HTMLFormElement | null;
    const searchInput = document.getElementById("filter-search") as HTMLInputElement | null;
    const progLangSelect = document.getElementById("filter-prog-lang") as HTMLSelectElement | null;
    const progLevelSelect = document.getElementById("filter-prog-level") as HTMLSelectElement | null;
    const subjectSelect = document.getElementById("filter-subject") as HTMLSelectElement | null;
    const hoursInput = document.getElementById("filter-hours") as HTMLInputElement | null;
    const hoursValueSpan = document.getElementById("hours-value");

    let allMembers: UserCV[] = [];
    let filteredMembers: UserCV[] = [];
    let currentPage = 1;
    let isDbError = false;
    let dbErrorMessage = "";

    async function fetchMembersData(): Promise<{ items: UserCV[]; errorMessage: string }> {
        try {
            const response = await fetch(`${API_URL}?skip=0&limit=100`);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data: ApiResponse = await response.json();
            return { items: data.items, errorMessage: "" };
        } catch (error) {
            console.error("Error loading data from server:", error);
            return {
                items: [],
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    function createRowElement(cv: UserCV): HTMLDivElement {
        const row = document.createElement("div");
        row.className = "catalog-row";

        const location = escapeHtml(cv.personal_info?.country_of_residence || cv.personal_info?.nationality || "Ukraine");
        const email = escapeHtml(cv.personal_info?.email || "—");
        const phone = escapeHtml(cv.personal_info?.phone || "—");
        const hours = cv.device_access?.weekly_hours != null ? `${cv.device_access.weekly_hours} h/week` : "Not specified";
        const fullName = escapeHtml(`${cv.personal_info?.first_name || ""} ${cv.personal_info?.last_name || ""}`.trim() || "Unnamed");
        const role = escapeHtml(cv.work_experience?.[0]?.job_title || "Role not specified");
        const photoSrc = cv.photo ? encodeURI(cv.photo) : FALLBACK_PHOTO;

        const langs = (cv.languages || []).map((l) => {
            const formattedLevel = PROFICIENCY_LABELS[l.proficiency as ProficiencyLevel] || l.proficiency;
            return `${escapeHtml(l.name)} — ${escapeHtml(formattedLevel)}`;
        }).join(", ") || "No languages listed";

        const badgesHtml = (cv.programming_skills || []).slice(0, 3).map((s) => {
            const levelLabel = PROGRAMMING_LEVEL_LABELS[s.level as ProgrammingLevel] || s.level;
            return `<span class="badge">${escapeHtml(s.language)} · ${escapeHtml(levelLabel)}</span>`;
        }).join("");

        row.innerHTML = `
            <div class="row-meta">
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Availability:</strong> ${hours}</p>
                <p><strong>Languages:</strong> ${langs}</p>
            </div>
            <article class="row-main">
                <div class="card-avatar">
                    <img src="${photoSrc}" alt="${fullName}" onerror="this.src='${FALLBACK_PHOTO}'" />
                </div>
                <div class="card-info">
                    <h3>${fullName}</h3>
                    <p class="fadedText">${role}</p>
                    <div class="card-badges">
                        ${badgesHtml || '<span class="badge">No skills listed</span>'}
                    </div>
                </div>
                    <a href="/member.html?id=${encodeURIComponent(cv.id)}" class="cta-button" rel="noopener noreferrer">View profile</a>
                    <button type="button" class="cta-button delete-cv-btn" data-cv-id="${escapeHtml(cv.id)}" aria-label="Delete CV for ${fullName}">Delete</button>
                </article>
            `;
            row.querySelector<HTMLButtonElement>(".delete-cv-btn")?.addEventListener("click", () => {
                void deleteMember(cv);
            });
            return row;
    }

    function renderCatalog(): void {
        if (!catalogContent || !paginationNav) return;

        catalogContent.querySelectorAll(".catalog-row, .empty-state, .db-error-banner").forEach((el) => el.remove());

        if (isDbError) {
            const errorBanner = document.createElement("div");
            errorBanner.className = "db-error-banner";
            errorBanner.textContent = `Unable to load CVs: ${dbErrorMessage}`;
            catalogContent.insertBefore(errorBanner, paginationNav);
        }

        if (filteredMembers.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";
            let message = "No resumes match your search.";
            if (isDbError) message = "CVs could not be loaded.";
            else if (allMembers.length === 0) message = "No CVs have been added yet.";
            emptyState.textContent = message;
            catalogContent.insertBefore(emptyState, paginationNav);
            updatePaginationUI(0);
            updateTotalCount();
            return;
        }

        const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
        currentPage = Math.min(currentPage, totalPages);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const pageItems = filteredMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        pageItems.forEach((cv) => {
            catalogContent.insertBefore(createRowElement(cv), paginationNav);
        });

        updatePaginationUI(totalPages);
        updateTotalCount();
    }

    function updateTotalCount(): void {
        const totalCount = document.getElementById("total-count");
        if (totalCount) totalCount.textContent = `${filteredMembers.length} CV${filteredMembers.length === 1 ? "" : "s"}`;
    }

    async function deleteMember(cv: UserCV): Promise<void> {
        const fullName = `${cv.personal_info.first_name} ${cv.personal_info.last_name}`;
        if (!window.confirm(`Delete the CV for ${fullName}? This action cannot be undone.`)) return;

        try {
            const response = await fetch(`${API_URL}/${encodeURIComponent(cv.id)}`, {
                method: "DELETE",
                headers: getAdminApiHeaders(),
            });
            if (!response.ok) {
                const details = await response.text();
                throw new Error(`HTTP ${response.status}: ${details || response.statusText}`);
            }
            allMembers = allMembers.filter((member) => member.id !== cv.id);
            applyFilters();
        } catch (error) {
            console.error("Error deleting CV:", error);
            window.alert(`Could not delete the CV. ${error instanceof Error ? error.message : "Please try again."}`);
        }
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
        catalogContent?.scrollIntoView({ behavior: "smooth" });
    }

    function applyFilters(): void {
        const query = searchInput?.value.trim().toLowerCase() || "";
        const selectedLang = progLangSelect?.value.trim().toLowerCase() || "";
        const selectedLevel = progLevelSelect?.value.trim().toLowerCase() || "";
        const selectedSubject = subjectSelect?.value.trim() || "";
        const minHours = Number(hoursInput?.value) || 0;

        filteredMembers = allMembers.filter((cv) => {
            const fullName = `${cv.personal_info?.first_name || ""} ${cv.personal_info?.last_name || ""}`.toLowerCase();
            const preferred = (cv.personal_info?.preferred_name || "").toLowerCase();
            const role = (cv.work_experience?.[0]?.job_title || "").toLowerCase();

            const matchesSearch = !query || fullName.includes(query) || preferred.includes(query) || role.includes(query);
            const matchesSkill = !selectedLang && !selectedLevel || (cv.programming_skills || []).some((skill) =>
                (!selectedLang || skill.language.toLowerCase() === selectedLang) &&
                (!selectedLevel || skill.level.toLowerCase() === selectedLevel)
            );
            const matchesSubject = !selectedSubject || (cv.favorite_subjects_in_school || []).includes(selectedSubject as SchoolSubject);
            const matchesHours = (cv.device_access?.weekly_hours ?? 0) >= minHours;

            return matchesSearch && matchesSkill && matchesSubject && matchesHours;
        });

        currentPage = 1;
        renderCatalog();
    }

    async function init(): Promise<void> {
        hoursInput?.addEventListener("input", () => {
            if (hoursValueSpan && hoursInput) hoursValueSpan.textContent = `${hoursInput.value} h`;
        });

        filtersForm?.addEventListener("submit", (e) => {
            e.preventDefault();
            applyFilters();
        });

        filtersForm?.addEventListener("reset", () => {
            setTimeout(() => {
                if (hoursValueSpan) hoursValueSpan.textContent = "0 h";
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
        isDbError = Boolean(fetchResult.errorMessage);
        dbErrorMessage = fetchResult.errorMessage;
        allMembers = fetchResult.items;
        filteredMembers = [...allMembers];

        renderCatalog();
    }

    init();
});
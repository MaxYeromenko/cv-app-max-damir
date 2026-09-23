export type Gender = "male" | "female" | "other";

export type ProficiencyLevel =
    | "beginner"
    | "elementary"
    | "intermediate"
    | "upper_intermediate"
    | "advanced"
    | "native";

export type ProgrammingLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type SchoolSubject =
    | "mathematics"
    | "physics"
    | "chemistry"
    | "biology"
    | "computer_science"
    | "history"
    | "geography"
    | "literature"
    | "english"
    | "other";

export interface UserPersonalInfo {
    first_name: string;
    last_name: string;
    preferred_name?: string | null;
    email: string;
    phone: string;
    date_of_birth: string;
    nationality: string;
    country_of_residence: string;
    gender: Gender;
}

export interface Language {
    name: string;
    proficiency: ProficiencyLevel;
}

export interface Job {
    job_title: string;
    company: string;
    location?: string;
    from_date: string;
    to_date?: string | null;
    description?: string | null;
}

export interface ScientificInterest {
    name: string;
    description?: string | null;
}

export interface Publication {
    title: string;
    journal?: string | null;
    publication_date?: string | null;
    authors: string[];
    url?: string | null;
}

export interface Award {
    title: string;
    organization?: string | null;
    date?: string | null;
    description?: string | null;
}

export interface ProgrammingSkill {
    language: string;
    level: ProgrammingLevel;
}

export interface DeviceAccess {
    weekly_hours: number;
}

export interface Hobby {
    name: string;
}

export interface UserCVRequest {
    photo?: string | null;
    personal_info: UserPersonalInfo;
    languages: Language[];
    work_experience: Job[];
    scientific_interests: ScientificInterest[];
    publications: Publication[];
    awards: Award[];
    favorite_subjects_in_school: SchoolSubject[];
    programming_skills: ProgrammingSkill[];
    device_access: DeviceAccess;
    hobbies: Hobby[];
}

export interface UserCV extends UserCVRequest {
    id: string;
}

export interface ApiResponse {
    total: number;
    skip: number;
    limit: number;
    items: UserCV[];
}

export const API_URL = "https://api-cv-app-max-damir.onrender.com/api/v1/users-cvs";
export const FALLBACK_PHOTO = "./public/cv.svg";

export const GENDER_LABELS: Record<Gender, string> = {
    male: "Чоловіча",
    female: "Жіноча",
    other: "Інша",
};

export const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
    beginner: "A1 (Beginner)",
    elementary: "A2 (Elementary)",
    intermediate: "B1 (Intermediate)",
    upper_intermediate: "B2 (Upper-Intermediate)",
    advanced: "C1 (Advanced)",
    native: "C2 (Native)",
};

export const PROGRAMMING_LEVEL_LABELS: Record<ProgrammingLevel, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    expert: "Expert",
};

export const SUBJECT_LABELS: Record<SchoolSubject, string> = {
    computer_science: "Інформатика",
    mathematics: "Математика",
    physics: "Фізика",
    chemistry: "Хімія",
    biology: "Біологія",
    history: "Історія",
    geography: "Географія",
    literature: "Література",
    english: "Англійська мова",
    other: "Інше",
};
export function escapeHtml(str: string | null | undefined): string {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function setElementText(id: string, text: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

export function getAdminApiHeaders(): Record<string, string> {
    const key = localStorage.getItem("adminApiKey");
    return key ? { "X-Admin-Key": key } : {};
}
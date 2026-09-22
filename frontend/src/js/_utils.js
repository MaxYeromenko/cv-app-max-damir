export function escapeHtml(str) {
    if (!str)
        return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
export function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el)
        el.textContent = text;
}

export function init() {
    const yearElement = document.getElementById("current-year");
    if (!yearElement)
        return;
    const currentYear = new Date().getFullYear().toString();
    yearElement.textContent = currentYear;
    yearElement.setAttribute("datetime", currentYear);
}

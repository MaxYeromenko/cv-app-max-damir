export function init(footer) {
    if (!footer)
        return;
    const yearElement = footer.querySelector("#current-year");
    if (!yearElement)
        return;
    const currentYear = new Date().getFullYear().toString();
    yearElement.textContent = currentYear;
    yearElement.setAttribute("datetime", currentYear);
}

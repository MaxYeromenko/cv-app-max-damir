import type { NullableElement } from "./_types";

export function init(footer: NullableElement): void {
    if (!footer) return;

    const yearElement: Element | null = footer.querySelector("#current-year");
    if (!yearElement) return;

    const currentYear: string = new Date().getFullYear().toString();
    yearElement.textContent = currentYear;
    yearElement.setAttribute("datetime", currentYear);
}
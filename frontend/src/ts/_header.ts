export function init(): void {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll<HTMLAnchorElement>("#main-nav a");

    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (href === currentPath || (currentPath === "/" && href === "/")) {
            link.parentElement?.classList.add("hidden");
            link.setAttribute("aria-current", "page");
        }
    });
}
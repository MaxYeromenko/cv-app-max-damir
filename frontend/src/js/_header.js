export function init() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll("#main-nav a");
    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (href === currentPath || (currentPath === "/" && href === "/")) {
            link.parentElement?.classList.add("hidden");
            link.setAttribute("aria-current", "page");
        }
    });
}

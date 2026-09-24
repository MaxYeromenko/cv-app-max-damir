import { init as initFooter } from "./_footer";
import { init as initMain } from "./_main";
import { init as initHeader } from "./_header";

document.addEventListener("DOMContentLoaded", () => {
    initHeader();
    initFooter();
    initMain();

    document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.ctrlKey) {
            switch (e.key) {
                case "1":
                    e.preventDefault();
                    window.location.href = "/";
                    break;
                case "2":
                    e.preventDefault();
                    window.location.href = "/catalog.html";
                    break;
                case "3":
                    e.preventDefault();
                    window.location.href = "/add-member.html";
                    break;
            }
        }
    });
});
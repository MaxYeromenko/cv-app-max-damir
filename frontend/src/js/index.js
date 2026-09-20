import { init as initFooter } from "./_footer.js";
import { init as initMain } from "./_main.js";
document.addEventListener("DOMContentLoaded", () => {
    initFooter();
    initMain();
    document.addEventListener("keydown", (e) => {
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

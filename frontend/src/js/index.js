import { init as initHeader } from "./_header.js";
import { init as initFooter } from "./_footer.js";
import { init as initMain } from "./_main.js";
document.addEventListener("DOMContentLoaded", () => {
    initHeader();
    initFooter();
    initMain();
});

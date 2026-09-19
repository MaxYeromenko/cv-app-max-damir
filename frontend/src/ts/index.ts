import { init as initHeader } from "./_header";
import { init as initFooter } from "./_footer";
import { init as initMain } from "./_main";

document.addEventListener("DOMContentLoaded", () => {
    initHeader();
    initFooter();
    initMain();
});
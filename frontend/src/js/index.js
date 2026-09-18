import { init as initFooter } from "./_footer.js";
import { init as initMain } from "./_main.js";
document.addEventListener("DOMContentLoaded", () => {
    const footerElement = document.getElementById("footer");
    initFooter(footerElement);
    const mainElement = document.querySelector("main");
    initMain(mainElement);
});

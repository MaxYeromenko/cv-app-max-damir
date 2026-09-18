import type { NullableElement } from "./_types";
import { init as initFooter } from "./_footer";
import { init as initMain } from "./_main";

document.addEventListener("DOMContentLoaded", () => {
    const footerElement: NullableElement = document.getElementById("footer");
    initFooter(footerElement);

    const mainElement: NullableElement = document.querySelector("main");
    initMain(mainElement);
});
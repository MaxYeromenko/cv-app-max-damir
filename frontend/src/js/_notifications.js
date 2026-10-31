import { escapeHtml } from "./_utils.js";
const MAX_TEXT_LENGTH = 180;
function truncateText(text) {
    const normalized = text.replace(/\s+/g, " ").trim();
    if (normalized.length <= MAX_TEXT_LENGTH)
        return normalized;
    return `${normalized.slice(0, MAX_TEXT_LENGTH - 1).trimEnd()}…`;
}
function logNotification(type, title, message) {
    const prefix = `[ui:${type}] ${title}`;
    if (type === "error") {
        console.error(prefix, message);
        return;
    }
    if (type === "warning") {
        console.warn(prefix, message);
        return;
    }
    console.info(prefix, message);
}
function getNotificationIcon(type) {
    switch (type) {
        case "success":
            return "✓";
        case "error":
            return "!";
        case "warning":
            return "⚠";
        default:
            return "i";
    }
}
function ensureNotificationRoot() {
    let toastRoot = document.getElementById("toast-root");
    if (!toastRoot) {
        toastRoot = document.createElement("div");
        toastRoot.id = "toast-root";
        toastRoot.className = "toast-root";
        document.body.appendChild(toastRoot);
    }
    return toastRoot;
}
function createToastMarkup(type, title, message) {
    const safeTitle = escapeHtml(title);
    const safeText = escapeHtml(truncateText(message));
    return `
        <div class="toast toast-${type}" role="status">
            <span class="toast-icon">${getNotificationIcon(type)}</span>
            <div class="toast-body">
                <strong class="toast-title">${safeTitle}</strong>
                <span class="toast-text">${safeText}</span>
            </div>
            <button type="button" class="toast-close" aria-label="Close notification">×</button>
        </div>
    `;
}
function renderToast(type, title, message, duration = 4200) {
    const toastRoot = ensureNotificationRoot();
    toastRoot.insertAdjacentHTML("beforeend", createToastMarkup(type, title, message));
    const toast = toastRoot.lastElementChild;
    if (!toast)
        return toastRoot;
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn?.addEventListener("click", () => {
        toast.classList.remove("is-visible");
        window.setTimeout(() => toast.remove(), 180);
    });
    requestAnimationFrame(() => {
        toast.classList.add("is-visible");
    });
    window.setTimeout(() => {
        toast.classList.remove("is-visible");
        window.setTimeout(() => toast.remove(), 180);
    }, duration);
    return toast;
}
export function showNotification(type, title, message, duration) {
    const safeMessage = message || "Unexpected error.";
    logNotification(type, title, safeMessage);
    renderToast(type, title, safeMessage, duration);
}
export function showSuccess(message, title = "Success") {
    showNotification("success", title, message, 3500);
}
export function showError(message, title = "Error") {
    showNotification("error", title, message, 5000);
}
export function showWarning(message, title = "Warning") {
    showNotification("warning", title, message, 4500);
}
export function showInfo(message, title = "Info") {
    showNotification("info", title, message, 4000);
}
function createConfirmMarkup(title, message, confirmText, cancelText, variant) {
    return `
        <div class="confirm-box">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(truncateText(message))}</p>
            <div class="confirm-actions">
                <button type="button" class="confirm-btn confirm-btn-secondary">${escapeHtml(cancelText)}</button>
                <button type="button" class="confirm-btn confirm-btn-${variant}">${escapeHtml(confirmText)}</button>
            </div>
        </div>
    `;
}
export async function confirmAction(options) {
    const { title = "Confirm action", message, confirmText = "Confirm", cancelText = "Cancel", variant = "primary", } = options;
    return new Promise((resolve) => {
        const confirmOverlay = document.createElement("div");
        confirmOverlay.className = "confirm-overlay";
        confirmOverlay.innerHTML = createConfirmMarkup(title, message, confirmText, cancelText, variant);
        const confirmDialog = confirmOverlay.querySelector(".confirm-box");
        const cancelBtn = confirmOverlay.querySelector(".confirm-btn-secondary");
        const confirmBtn = confirmOverlay.querySelector(".confirm-btn-primary, .confirm-btn-danger");
        const closeDialog = (nextValue) => {
            confirmDialog?.classList.remove("is-visible");
            window.setTimeout(() => confirmOverlay.remove(), 180);
            resolve(nextValue);
        };
        cancelBtn?.addEventListener("click", () => closeDialog(false));
        confirmBtn?.addEventListener("click", () => closeDialog(true));
        confirmOverlay.addEventListener("click", (event) => {
            if (event.target === confirmOverlay) {
                closeDialog(false);
            }
        });
        document.body.appendChild(confirmOverlay);
        requestAnimationFrame(() => {
            confirmDialog?.classList.add("is-visible");
        });
    });
}

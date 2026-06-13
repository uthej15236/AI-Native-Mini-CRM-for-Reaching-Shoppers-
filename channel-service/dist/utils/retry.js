"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postJsonWithRetry = exports.sleep = void 0;
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
exports.sleep = sleep;
const postJsonWithRetry = async (url, payload, secret, attempts = 3) => {
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-xeno-webhook-secret": secret,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return;
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown network error");
            if (attempt < attempts) {
                await (0, exports.sleep)(250 * attempt);
            }
        }
    }
    throw lastError ?? new Error("Failed to deliver callback");
};
exports.postJsonWithRetry = postJsonWithRetry;
//# sourceMappingURL=retry.js.map
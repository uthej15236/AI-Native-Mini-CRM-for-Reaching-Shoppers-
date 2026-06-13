export const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const postJsonWithRetry = async (url: string, payload: unknown, secret: string, attempts = 3): Promise<void> => {
  let lastError: Error | null = null;

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
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown network error");
      if (attempt < attempts) {
        await sleep(250 * attempt);
      }
    }
  }

  throw lastError ?? new Error("Failed to deliver callback");
};


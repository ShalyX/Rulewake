type Sleep = (milliseconds: number) => Promise<void>;

export type QwenTextRequest = {
  apiKey: string;
  instructions: string;
  prompt: string;
  fetchImpl?: typeof fetch | undefined;
  sleepImpl?: Sleep | undefined;
  baseUrl?: string | undefined;
  timeoutMs?: number | undefined;
  maxOutputTokens?: number | undefined;
  maxAttempts?: number | undefined;
};

const retryableStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);
const defaultBackoffMs = [250, 750, 1_500];

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryAfterMs(response: Response, attempt: number): number {
  const value = response.headers.get("retry-after");
  if (value) {
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(2_000, seconds * 1_000);
    }
    const date = Date.parse(value);
    if (Number.isFinite(date)) {
      return Math.min(2_000, Math.max(0, date - Date.now()));
    }
  }
  return defaultBackoffMs[Math.min(attempt, defaultBackoffMs.length - 1)]!;
}

function isRetryableTransportError(error: unknown): boolean {
  return error instanceof TypeError
    || (error instanceof Error && error.name === "AbortError");
}

function responseText(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const record = payload as {
    output_text?: unknown;
    output?: Array<{
      type?: unknown;
      content?: Array<{ type?: unknown; text?: unknown }>;
    }>;
  };
  if (typeof record.output_text === "string" && record.output_text.trim() !== "") {
    return record.output_text;
  }
  return record.output
    ?.flatMap((item) => item.content ?? [])
    .find((item) => item.type === "output_text" && typeof item.text === "string")
    ?.text as string | undefined ?? null;
}

export async function requestQwenText(input: QwenTextRequest): Promise<string> {
  if (input.apiKey.trim() === "") throw new Error("QWEN_API_KEY is not configured");
  const attempts = input.maxAttempts ?? 3;
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 4) {
    throw new Error("Qwen maxAttempts must be an integer between 1 and 4");
  }
  const timeoutMs = input.timeoutMs ?? 30_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) {
    throw new Error("Qwen timeoutMs must be positive");
  }
  const fetchImpl = input.fetchImpl ?? fetch;
  const sleepImpl = input.sleepImpl ?? delay;
  const baseUrl = (input.baseUrl ?? "https://hackathon.bitgetops.com/v1")
    .replace(/\/$/, "");
  const body = JSON.stringify({
    model: "qwen3.8-max",
    temperature: 0,
    max_output_tokens: input.maxOutputTokens ?? 12_000,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: input.instructions }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: input.prompt }],
      },
    ],
  });

  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${baseUrl}/responses`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${input.apiKey}`,
          "content-type": "application/json",
        },
        body,
        signal: controller.signal,
      });
      if (!response.ok) {
        const error = new Error(`Qwen request failed with HTTP ${response.status}`);
        if (!retryableStatuses.has(response.status) || attempt === attempts - 1) {
          throw error;
        }
        lastError = error;
        await sleepImpl(retryAfterMs(response, attempt));
        continue;
      }

      try {
        const content = responseText(await response.json());
        if (content) return content;
        lastError = new Error("Qwen response is missing message content");
      } catch (error) {
        lastError = error instanceof Error
          ? error
          : new Error("Qwen response body is not valid JSON");
      }
      if (attempt === attempts - 1) throw lastError;
      await sleepImpl(defaultBackoffMs[Math.min(attempt, defaultBackoffMs.length - 1)]!);
    } catch (error) {
      if (!isRetryableTransportError(error) || attempt === attempts - 1) throw error;
      lastError = error;
      await sleepImpl(defaultBackoffMs[Math.min(attempt, defaultBackoffMs.length - 1)]!);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Qwen request produced no response");
}

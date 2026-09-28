import { beforeEach, describe, expect, it, vi } from "vitest";

const { explainImpactWithQwen } = vi.hoisted(() => ({
  explainImpactWithQwen: vi.fn(),
}));

vi.mock("@risk-engine/server", () => ({ explainImpactWithQwen }));

import { POST } from "../app/api/explain/route";

const validBody = {
  eventId: "rstrc-2026-07-01",
  accountId: "canonical-risk",
  targetRatio: "0.75",
};

function request(
  body: string,
  {
    contentType = "application/json",
    origin = "http://localhost",
    client = "192.0.2.10",
  }: { contentType?: string; origin?: string; client?: string } = {},
): Request {
  const headers = new Headers({
    origin,
    "x-forwarded-for": client,
  });
  if (contentType) headers.set("content-type", contentType);
  return new Request("http://localhost/api/explain", {
    method: "POST",
    headers,
    body,
  });
}

beforeEach(() => {
  explainImpactWithQwen.mockReset();
  explainImpactWithQwen.mockResolvedValue({
    mode: "deterministic_fallback",
    text: "Validated deterministic explanation.",
    fallbackReason: "Qwen is not configured.",
  });
});

describe("explanation route security boundary", () => {
  it("gives the subsidized Qwen endpoint enough bounded time to answer", async () => {
    const response = await POST(request(JSON.stringify(validBody), {
      client: "192.0.2.16",
    }));

    expect(response.status).toBe(200);
    expect(explainImpactWithQwen).toHaveBeenCalledWith(expect.objectContaining({
      timeoutMs: 25_000,
      maxAttempts: 1,
    }));
  });

  it("rejects cross-origin browser requests before model spend", async () => {
    const response = await POST(request(JSON.stringify(validBody), {
      origin: "https://attacker.example",
      client: "192.0.2.11",
    }));

    expect(response.status).toBe(403);
    expect(explainImpactWithQwen).not.toHaveBeenCalled();
  });

  it("requires a JSON content type before reading the body", async () => {
    const response = await POST(request(JSON.stringify(validBody), {
      contentType: "text/plain",
      client: "192.0.2.12",
    }));

    expect(response.status).toBe(415);
    expect(explainImpactWithQwen).not.toHaveBeenCalled();
  });

  it("stops reading oversized streamed bodies", async () => {
    const response = await POST(request(JSON.stringify({
      ...validBody,
      padding: "x".repeat(2_000),
    }), { client: "192.0.2.13" }));

    expect(response.status).toBe(413);
    expect(explainImpactWithQwen).not.toHaveBeenCalled();
  });

  it("rate limits repeated requests before additional model spend", async () => {
    const responses = [];
    for (let index = 0; index < 9; index += 1) {
      responses.push(await POST(request(JSON.stringify(validBody), {
        client: "192.0.2.14",
      })));
    }

    expect(responses.slice(0, 8).every((response) => response.status === 200)).toBe(true);
    expect(responses[8]?.status).toBe(429);
    expect(responses[8]?.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(explainImpactWithQwen).toHaveBeenCalledTimes(8);
  });

  it("returns a generic failure without exposing thrown secrets", async () => {
    explainImpactWithQwen.mockRejectedValueOnce(
      new Error("QWEN_API_KEY=do-not-leak"),
    );
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(request(JSON.stringify({
      ...validBody,
      targetRatio: "0.65",
    }), { client: "192.0.2.15" }));
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(text).not.toContain("do-not-leak");
    expect(log.mock.calls.flat().join(" ")).not.toContain("do-not-leak");
    log.mockRestore();
  });
});

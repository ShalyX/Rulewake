import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import {
  extractAnnouncementWithQwen,
  scoreExtractionEnvelope,
  splitAnnouncementByAsset,
} from "../src/qwen-extraction.js";

const fixturePath = fileURLToPath(new URL(
  "./fixtures/announcements/rstrc-2026-07-01.json",
  import.meta.url,
));
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
  id: string;
  expectedOutcome: "accepted";
  source: {
    url: string;
    title: string;
    publishedAt: string;
    effectiveAt: string;
    timezone: string;
    sourceHash: string;
  };
  sourceText: string;
  golden: unknown;
};

function responseWith(content: unknown): Response {
  return new Response(JSON.stringify({
    output: [{
      type: "message",
      content: [{ type: "output_text", text: JSON.stringify(content) }],
    }],
  }), { status: 200, headers: { "content-type": "application/json" } });
}

describe("Qwen announcement extraction", () => {
  it("sends only bounded public source context and parses an accepted envelope", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("authorization")).toBe("Bearer secret-test-key");
      const body = JSON.parse(String(init?.body)) as {
        model: string;
        temperature: number;
        input: Array<{ content: Array<{ text: string }> }>;
      };
      expect(body.model).toBe("qwen3.8-max");
      expect(body.temperature).toBe(0);
      expect(body.input.at(-1)?.content[0]?.text).toContain(fixture.sourceText);
      expect(body.input.at(-1)?.content[0]?.text).not.toContain("BITGET_API_KEY");
      return responseWith({ status: "accepted", candidate: fixture.golden });
    });

    const result = await extractAnnouncementWithQwen({
      apiKey: "secret-test-key",
      source: fixture.source,
      sourceText: fixture.sourceText,
      fetchImpl,
    });

    expect(result.status).toBe("accepted");
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      "https://hackathon.bitgetops.com/v1/responses",
    );
  });

  it("accepts an explicit model rejection without fabricating a candidate", async () => {
    const result = await extractAnnouncementWithQwen({
      apiKey: "secret-test-key",
      source: fixture.source,
      sourceText: fixture.sourceText,
      fetchImpl: vi.fn(async () => responseWith({
        status: "rejected",
        reason: "before schedule is absent",
      })),
    });

    expect(result).toEqual({
      status: "rejected",
      reason: "before schedule is absent",
    });
  });

  it("replaces model-formatted provenance with server-owned source metadata", async () => {
    const candidate = structuredClone(fixture.golden) as {
      source: { title: string; effectiveAt: string; timezone: string };
    };
    candidate.source.title = "model rewrite";
    candidate.source.effectiveAt = "2026-07-01T11:00:00+01:00";
    candidate.source.timezone = "GMT";

    const result = await extractAnnouncementWithQwen({
      apiKey: "secret-test-key",
      source: fixture.source,
      sourceText: fixture.sourceText,
      fetchImpl: vi.fn(async () => responseWith({ status: "accepted", candidate })),
    });

    expect(result.status).toBe("accepted");
    if (result.status === "accepted") {
      expect(result.candidate.source).toEqual(
        (fixture.golden as { source: unknown }).source,
      );
    }
  });

  it("splits multi-asset source text into source-bound single-asset chunks", () => {
    const sourceText = [
      "Reviewed title. Published 2026-07-09T07:00:00Z. Effective 2026-07-10T10:00:00Z.",
      "rA collateral_ratio in USD. Before adjustment: 0-above 0.9. After adjustment: 0-above 0.8.",
      "rB collateral_ratio in USD. Before adjustment: 0-above 0.7. After adjustment: 0-above 0.6.",
    ].join(" ");

    const chunks = splitAnnouncementByAsset(sourceText);

    expect(chunks.map((chunk) => chunk.asset)).toEqual(["rA", "rB"]);
    expect(chunks[0]?.sourceText).toContain("Published 2026-07-09T07:00:00Z");
    expect(chunks[0]?.sourceText).toContain("rA collateral_ratio");
    expect(chunks[0]?.sourceText).not.toContain("rB collateral_ratio");
    expect(chunks[1]?.sourceText).toContain("rB collateral_ratio");
    expect(chunks[1]?.sourceText).not.toContain("rA collateral_ratio");
  });

  it("extracts multi-asset tables per asset and validates one ordered aggregate", async () => {
    const sourceText = [
      "Reviewed title. Published 2026-07-09T07:00:00Z. Effective 2026-07-10T10:00:00Z.",
      "rA collateral_ratio in USD. Before adjustment: 0-above 0.9. After adjustment: 0-above 0.8.",
      "rB collateral_ratio in USD. Before adjustment: 0-above 0.7. After adjustment: 0-above 0.6.",
    ].join(" ");
    const candidateFor = (asset: string, before: string, after: string) => ({
      schemaVersion: "1",
      source: fixture.source,
      changes: [{
        asset,
        parameter: "collateral_ratio",
        unit: "USD",
        before: [{ startUsd: "0", endUsd: null, rate: before }],
        after: [{ startUsd: "0", endUsd: null, rate: after }],
      }],
      unsupportedStatements: [],
      extraction: {
        model: "qwen3.8-max",
        createdAt: "2026-09-18T00:00:00Z",
        confidence: "high",
      },
    });
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        input: Array<{ content: Array<{ text: string }> }>;
      };
      const prompt = body.input.at(-1)?.content[0]?.text ?? "";
      if (prompt.includes("rA collateral_ratio")) {
        expect(prompt).not.toContain("rB collateral_ratio");
        return responseWith({ status: "accepted", candidate: candidateFor("rA", "0.9", "0.8") });
      }
      expect(prompt).toContain("rB collateral_ratio");
      expect(prompt).not.toContain("rA collateral_ratio");
      return responseWith({ status: "accepted", candidate: candidateFor("rB", "0.7", "0.6") });
    });

    const result = await extractAnnouncementWithQwen({
      apiKey: "secret-test-key",
      source: fixture.source,
      sourceText,
      fetchImpl,
    });

    expect(result.status).toBe("accepted");
    if (result.status === "accepted") {
      expect(result.candidate.changes.map((change) => change.asset)).toEqual(["rA", "rB"]);
    }
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fails the whole multi-asset extraction when any asset chunk is rejected", async () => {
    const sourceText = [
      "Reviewed title. Published 2026-07-09T07:00:00Z. Effective 2026-07-10T10:00:00Z.",
      "rA collateral_ratio in USD. Before adjustment: 0-above 0.9. After adjustment: 0-above 0.8.",
      "rB collateral_ratio in USD. Before adjustment: 0-above 0.7. After adjustment: 0-above 0.6.",
    ].join(" ");
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const prompt = String(init?.body);
      return prompt.includes("rA collateral_ratio")
        ? responseWith({
          status: "accepted",
          candidate: {
            ...(fixture.golden as object),
            changes: [{
              asset: "rA", parameter: "collateral_ratio", unit: "USD",
              before: [{ startUsd: "0", endUsd: null, rate: "0.9" }],
              after: [{ startUsd: "0", endUsd: null, rate: "0.8" }],
            }],
            unsupportedStatements: [],
          },
        })
        : responseWith({ status: "rejected", reason: "table is incomplete" });
    });

    const result = await extractAnnouncementWithQwen({
      apiKey: "secret-test-key",
      source: fixture.source,
      sourceText,
      fetchImpl,
    });

    expect(result).toEqual({
      status: "rejected",
      reason: "rB chunk rejected: table is incomplete",
    });
  });

  it("makes one bounded repair attempt and then fails closed on malformed model JSON", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      output: [{
        type: "message",
        content: [{ type: "output_text", text: "not-json" }],
      }],
    }), { status: 200 }));

    await expect(extractAnnouncementWithQwen({
      apiKey: "secret-test-key",
      source: fixture.source,
      sourceText: fixture.sourceText,
      fetchImpl,
    })).rejects.toThrow(/strict JSON/i);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("retries one transient transport failure and no more", async () => {
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(responseWith({
        status: "accepted",
        candidate: fixture.golden,
      }));

    const result = await extractAnnouncementWithQwen({
      apiKey: "secret-test-key",
      source: fixture.source,
      sourceText: fixture.sourceText,
      fetchImpl,
    });

    expect(result.status).toBe("accepted");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("retries bounded transient HTTP responses before succeeding", async () => {
    const sleepImpl = vi.fn(async () => undefined);
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response("busy", {
        status: 503,
        headers: { "retry-after": "1" },
      }))
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(responseWith({
        status: "accepted",
        candidate: fixture.golden,
      }));

    const result = await extractAnnouncementWithQwen({
      apiKey: "secret-test-key",
      source: fixture.source,
      sourceText: fixture.sourceText,
      fetchImpl,
      sleepImpl,
    });

    expect(result.status).toBe("accepted");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleepImpl).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-transient HTTP failure", async () => {
    const fetchImpl = vi.fn(async () => new Response("bad request", { status: 400 }));

    await expect(extractAnnouncementWithQwen({
      apiKey: "secret-test-key",
      source: fixture.source,
      sourceText: fixture.sourceText,
      fetchImpl,
    })).rejects.toThrow(/HTTP 400/i);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("repairs a validator-rejected candidate once using the same bound source", async () => {
    const invalid = structuredClone(fixture.golden) as {
      changes: Array<{ after: Array<{ rate: string }> }>;
    };
    invalid.changes[0]!.after[0]!.rate = "0.123456";
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(responseWith({ status: "accepted", candidate: invalid }))
      .mockResolvedValueOnce(responseWith({
        status: "accepted",
        candidate: fixture.golden,
      }));

    const result = await extractAnnouncementWithQwen({
      apiKey: "secret-test-key",
      source: fixture.source,
      sourceText: fixture.sourceText,
      fetchImpl,
    });

    expect(result.status).toBe("accepted");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const repairBody = JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body)) as {
      input: Array<{ content: Array<{ text: string }> }>;
    };
    expect(repairBody.input.at(-1)?.content[0]?.text).toMatch(/repair/i);
  });

  it("scores exact validated changes separately from model prose metadata", () => {
    const score = scoreExtractionEnvelope(
      { status: "accepted", candidate: fixture.golden },
      fixture,
    );

    expect(score).toEqual({
      fixtureId: fixture.id,
      passed: true,
      outcomeCorrect: true,
      sourceCorrect: true,
      changesExact: true,
      unsupportedCorrect: true,
      validationErrors: [],
    });
  });

  it("does not treat JSON object key order as an extraction error", () => {
    const golden = structuredClone(fixture.golden) as {
      source: Record<string, unknown>;
    };
    const entries = Object.entries(golden.source).reverse();
    golden.source = Object.fromEntries(entries);

    const score = scoreExtractionEnvelope(
      { status: "accepted", candidate: golden },
      fixture,
    );

    expect(score.passed).toBe(true);
    expect(score.sourceCorrect).toBe(true);
  });

  it("scores unsupported-statement detection semantically, not by exact prose", () => {
    const candidate = structuredClone(fixture.golden) as {
      unsupportedStatements: string[];
    };
    candidate.unsupportedStatements = [
      "Maintenance margin is mentioned without a complete supported schedule.",
    ];

    const score = scoreExtractionEnvelope(
      { status: "accepted", candidate },
      fixture,
    );

    expect(score.passed).toBe(true);
    expect(score.unsupportedCorrect).toBe(true);
  });
});

import { describe, expect, it, vi } from "vitest";

import {
  explainImpactWithQwen,
  type ImpactExplanationFacts,
} from "../src/qwen-explanation.js";

const facts: ImpactExplanationFacts = {
  eventTitle: "rSTRC collateral ratio change",
  asset: "rSTRC",
  beforeRate: "0.9",
  afterRate: "0.85",
  effectiveEquityDeltaUsd: "-5000",
  currentMarginRatio: "0.9444444444",
  projectedMarginRatio: "1",
  currentRiskBand: "warning",
  projectedRiskBand: "critical",
  targetRatio: "0.75",
  bufferUsd: "28333.34",
};

const grounded = "The rSTRC schedule changes from 90% to 85%. Effective equity falls by $5,000.00, moving the margin ratio from 94.44% to 100.00% and the account from warning to critical. The $28,333.34 buffer is the estimated top-up needed to reach the 75% target under held-constant assumptions. This is an estimate; you decide whether to act.";

function responseWith(text: string): Response {
  return new Response(JSON.stringify({ output_text: text }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("Qwen impact explanation", () => {
  it("accepts grounded prose containing only approved calculation numbers", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => responseWith(grounded));

    const result = await explainImpactWithQwen({
      apiKey: "secret-test-key",
      facts,
      fetchImpl,
    });

    expect(result).toEqual({
      mode: "live_qwen",
      text: grounded,
      fallbackReason: null,
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as {
      input: Array<{ content: Array<{ text: string }> }>;
    };
    expect(body.input.at(-1)?.content[0]?.text).not.toMatch(/api.?key|passphrase/i);
  });

  it("repairs once and falls back when Qwen invents a number", async () => {
    const fetchImpl = vi.fn(async () => responseWith(`${grounded} Confidence: 97%.`));

    const result = await explainImpactWithQwen({
      apiKey: "secret-test-key",
      facts,
      fetchImpl,
    });

    expect(result.mode).toBe("deterministic_fallback");
    expect(result.fallbackReason).toMatch(/grounding checks/i);
    expect(result.text).not.toContain("97%");
    expect(result.text).toContain("100.00%");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("falls back after bounded transient transport attempts", async () => {
    const fetchImpl = vi.fn(async () => new Response("busy", { status: 503 }));

    const result = await explainImpactWithQwen({
      apiKey: "secret-test-key",
      facts,
      fetchImpl,
      sleepImpl: vi.fn(async () => undefined),
    });

    expect(result.mode).toBe("deterministic_fallback");
    expect(result.fallbackReason).toMatch(/unavailable/i);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("falls back without a network call when the server key is absent", async () => {
    const fetchImpl = vi.fn();

    const result = await explainImpactWithQwen({
      apiKey: "",
      facts,
      fetchImpl,
    });

    expect(result.mode).toBe("deterministic_fallback");
    expect(result.fallbackReason).toMatch(/not configured/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects directive trading language even when its numbers are grounded", async () => {
    const directive = `${grounded} You should deposit $28,333.34 now.`;
    const fetchImpl = vi.fn(async () => responseWith(directive));

    const result = await explainImpactWithQwen({
      apiKey: "secret-test-key",
      facts,
      fetchImpl,
    });

    expect(result.mode).toBe("deterministic_fallback");
    expect(result.text).not.toMatch(/should deposit/i);
  });

  it("rejects fluent but ungrounded prose that omits the computed transition", async () => {
    const vague = "The reviewed event affects the account under the assumptions shown in the desk. The result is an estimate and the user decides whether to act.";
    const fetchImpl = vi.fn(async () => responseWith(vague));

    const result = await explainImpactWithQwen({
      apiKey: "secret-test-key",
      facts,
      fetchImpl,
    });

    expect(result.mode).toBe("deterministic_fallback");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.text).toContain("94.44%");
    expect(result.text).toContain("100.00%");
  });
});

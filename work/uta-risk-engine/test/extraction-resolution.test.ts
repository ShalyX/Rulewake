import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { resolveParameterChange } from "../src/extraction-resolution.js";

const fixturePath = fileURLToPath(new URL(
  "./fixtures/announcements/rstrc-2026-07-01.json",
  import.meta.url,
));
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
  source: { url: string; sourceHash: string };
  sourceText: string;
  golden: unknown;
};
const context = {
  sourceUrl: fixture.source.url,
  sourceHash: fixture.source.sourceHash,
  sourceText: fixture.sourceText,
};

describe("parameter-change resolution", () => {
  it("uses a valid live Qwen result when available", () => {
    const result = resolveParameterChange({
      liveEnvelope: { status: "accepted", candidate: fixture.golden },
      reviewedGolden: fixture.golden,
      context,
    });

    expect(result.mode).toBe("live_qwen");
    expect(result.fallbackReason).toBeNull();
  });

  it("uses the reviewed fixture after an explicit model rejection", () => {
    const result = resolveParameterChange({
      liveEnvelope: { status: "rejected", reason: "table is incomplete" },
      reviewedGolden: fixture.golden,
      context,
    });

    expect(result.mode).toBe("reviewed_fixture");
    expect(result.fallbackReason).toBe("table is incomplete");
  });

  it("uses the reviewed fixture after malformed live output", () => {
    const result = resolveParameterChange({
      liveEnvelope: { status: "accepted", candidate: { invented: true } },
      reviewedGolden: fixture.golden,
      context,
    });

    expect(result.mode).toBe("reviewed_fixture");
    expect(result.fallbackReason).toMatch(/live validation failed/i);
  });

  it("refuses a fallback whose source binding is stale", () => {
    expect(() => resolveParameterChange({
      liveEnvelope: null,
      reviewedGolden: fixture.golden,
      context: { ...context, sourceHash: "sha256:changed" },
    })).toThrow(/source binding/i);
  });
});

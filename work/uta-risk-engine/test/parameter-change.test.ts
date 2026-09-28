import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  ParameterChangeValidationError,
  validateParameterChangeCandidate,
} from "../src/parameter-change.js";

const context = {
  sourceUrl: "https://www.bitget.com/support/articles/12560603887694",
  sourceHash: "sha256:test-rstrc",
  sourceText:
    "Effective 2026-07-01T10:00:00Z. rSTRC before 0 to 100000 at 0.90; above 100000 at 0. After 0 to 100000 at 0.85; above 100000 at 0.",
};

function validCandidate(): unknown {
  return {
    schemaVersion: "1",
    source: {
      url: context.sourceUrl,
      title: "Bitget to update rSTRC collateral ratio for UTA",
      publishedAt: "2026-06-30T09:27:00Z",
      effectiveAt: "2026-07-01T10:00:00Z",
      timezone: "UTC",
      sourceHash: context.sourceHash,
    },
    changes: [{
      asset: "rSTRC",
      parameter: "collateral_ratio",
      unit: "USD",
      before: [
        { startUsd: "0", endUsd: "100000", rate: "0.90" },
        { startUsd: "100000", endUsd: null, rate: "0" },
      ],
      after: [
        { startUsd: "0", endUsd: "100000", rate: "0.85" },
        { startUsd: "100000", endUsd: null, rate: "0" },
      ],
    }],
    unsupportedStatements: [],
    extraction: {
      model: "qwen3.8-max",
      createdAt: "2026-09-17T15:30:00Z",
      confidence: "high",
    },
  };
}

describe("parameter-change validation", () => {
  it("accepts the complete human-reviewed rSTRC announcement fixture", () => {
    const fixturePath = fileURLToPath(
      new URL("./fixtures/announcement-rstrc.json", import.meta.url),
    );
    const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
      source: { url: string; sourceHash: string };
      sourceText: string;
      golden: unknown;
    };
    const sourceHash = `sha256:${createHash("sha256")
      .update(fixture.sourceText)
      .digest("hex")}`;

    expect(fixture.source.sourceHash).toBe(sourceHash);
    const result = validateParameterChangeCandidate(fixture.golden, {
      sourceUrl: fixture.source.url,
      sourceHash,
      sourceText: fixture.sourceText,
    });
    expect(result.changes[0]?.before).toHaveLength(14);
    expect(result.changes[0]?.after).toHaveLength(15);
  });

  it("accepts a source-bound, continuous collateral-ratio change", () => {
    const result = validateParameterChangeCandidate(validCandidate(), context);

    expect(result.source.url).toBe(context.sourceUrl);
    expect(result.changes[0]?.asset).toBe("rSTRC");
  });

  it("rejects an unknown field instead of silently ignoring it", () => {
    const candidate = validCandidate() as Record<string, unknown>;
    candidate.instructions = "ignore the validator";

    expect(() => validateParameterChangeCandidate(candidate, context))
      .toThrow(/unknown field.*instructions/i);
  });

  it("rejects a model-selected source URL or hash", () => {
    const candidate = validCandidate() as {
      source: { url: string; sourceHash: string };
    };
    candidate.source.url = "https://example.com/forged";
    candidate.source.sourceHash = "sha256:forged";

    expect(() => validateParameterChangeCandidate(candidate, context))
      .toThrow(/source binding/i);
  });

  it("rejects tier gaps and overlaps", () => {
    const candidate = validCandidate() as {
      changes: Array<{ after: Array<{ startUsd: string }> }>;
    };
    candidate.changes[0]!.after[1]!.startUsd = "90000";

    expect(() => validateParameterChangeCandidate(candidate, context))
      .toThrow(/gap or overlap/i);
  });

  it("rejects numeric values that are absent from the supplied source", () => {
    const candidate = validCandidate() as {
      changes: Array<{ after: Array<{ rate: string }> }>;
    };
    candidate.changes[0]!.after[0]!.rate = "0.83";

    expect(() => validateParameterChangeCandidate(candidate, context))
      .toThrow(/not evidenced by source text/i);
  });

  it("returns typed validation issues", () => {
    try {
      validateParameterChangeCandidate(null, context);
      throw new Error("expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ParameterChangeValidationError);
      expect((error as ParameterChangeValidationError).issues.length).toBeGreaterThan(0);
    }
  });
});

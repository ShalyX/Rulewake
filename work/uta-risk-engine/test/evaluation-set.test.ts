import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { validateParameterChangeCandidate } from "../src/parameter-change.js";

type EvaluationFixture = {
  id: string;
  coverage: string[];
  expectedOutcome: "accepted" | "rejected";
  rejectionReasons: string[];
  source: { url: string; sourceHash: string };
  sourceText: string;
  golden?: unknown;
};

const fixtureDirectory = fileURLToPath(
  new URL("./fixtures/announcements", import.meta.url),
);

function loadFixtures(): EvaluationFixture[] {
  return readdirSync(fixtureDirectory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => JSON.parse(
      readFileSync(join(fixtureDirectory, name), "utf8"),
    ) as EvaluationFixture);
}

describe("announcement extraction evaluation set", () => {
  const fixtures = loadFixtures();

  it("contains ten distinct official announcement fixtures", () => {
    expect(fixtures).toHaveLength(10);
    expect(new Set(fixtures.map((fixture) => fixture.id)).size).toBe(10);
    expect(fixtures.every((fixture) => fixture.source.url.startsWith(
      "https://www.bitget.com/support/articles/",
    ))).toBe(true);
  });

  it("covers the release-set difficulty requirements", () => {
    const count = (tag: string) => fixtures.filter(
      (fixture) => fixture.coverage.includes(tag),
    ).length;

    expect(count("collateral_only")).toBeGreaterThanOrEqual(3);
    expect(count("maintenance_or_leverage")).toBeGreaterThanOrEqual(2);
    expect(count("mixed_change")).toBeGreaterThanOrEqual(1);
    expect(count("multi_asset")).toBeGreaterThanOrEqual(1);
    expect(count("unbounded_tier")).toBeGreaterThanOrEqual(1);
    expect(count("ambiguous_or_unsupported")).toBeGreaterThanOrEqual(1);
  });

  it("binds every fixture to the hash of its reviewed source text", () => {
    for (const fixture of fixtures) {
      const hash = `sha256:${createHash("sha256")
        .update(fixture.sourceText)
        .digest("hex")}`;
      expect(fixture.source.sourceHash, fixture.id).toBe(hash);
    }
  });

  it("accepts every supported golden and documents every rejection", () => {
    for (const fixture of fixtures) {
      if (fixture.expectedOutcome === "accepted") {
        expect(fixture.golden, fixture.id).toBeDefined();
        expect(() => validateParameterChangeCandidate(fixture.golden, {
          sourceUrl: fixture.source.url,
          sourceHash: fixture.source.sourceHash,
          sourceText: fixture.sourceText,
        }), fixture.id).not.toThrow();
        expect(fixture.rejectionReasons, fixture.id).toEqual([]);
      } else {
        expect(fixture.golden, fixture.id).toBeUndefined();
        expect(fixture.rejectionReasons.length, fixture.id).toBeGreaterThan(0);
      }
    }
  });
});

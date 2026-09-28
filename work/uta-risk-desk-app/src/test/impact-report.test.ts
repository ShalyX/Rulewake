import { describe, expect, it } from "vitest";

import { calculateImpact } from "@risk-engine";
import {
  buildImpactReport,
  createImpactWorksheetArtifact,
} from "../domain/impact-report";
import { sampleScenario } from "../data/sample-scenario";

describe("share-safe impact report", () => {
  it("serializes only reviewed source, deterministic outputs and explicit assumptions", () => {
    const change = sampleScenario.event.change;
    const trace = calculateImpact({
      baseline: sampleScenario.account,
      changes: [{
        asset: change.asset,
        grossUsdBefore: sampleScenario.account.holdingsUsd[change.asset]!,
        grossUsdAfter: sampleScenario.account.holdingsUsd[change.asset]!,
        oldTiers: change.before,
        newTiers: change.after,
      }],
    });

    const report = buildImpactReport({
      event: sampleScenario.event,
      targetRatio: "0.75",
      bufferUsd: "28333.34",
      trace,
    });

    expect(report).toContain("rSTRC collateral ratio change");
    expect(report).toContain("https://www.bitget.com/support/articles/12560603887694");
    expect(report).toContain("Projected margin ratio: 100.00%");
    expect(report).toContain("Buffer to 75% target: $28,333.34");
    expect(report).toMatch(/positions held constant/i);
    expect(report).not.toMatch(/api[_ -]?key|secret|passphrase|private note/i);
  });

  it("builds a portable, print-ready and share-safe decision worksheet", () => {
    const change = sampleScenario.event.change;
    const trace = calculateImpact({
      baseline: sampleScenario.account,
      changes: [{
        asset: change.asset,
        grossUsdBefore: sampleScenario.account.holdingsUsd[change.asset]!,
        grossUsdAfter: sampleScenario.account.holdingsUsd[change.asset]!,
        oldTiers: change.before,
        newTiers: change.after,
      }],
    });

    const artifact = createImpactWorksheetArtifact({
      accountLabel: "Canonical UTA sample",
      event: sampleScenario.event,
      targetRatio: "0.75",
      bufferUsd: "28333.34",
      trace,
      generatedAt: "2026-09-18T09:45:00.000Z",
    });

    expect(artifact.filename).toBe("collateral-impact-rstrc-2026-09-18.html");
    expect(artifact.mimeType).toBe("text/html;charset=utf-8");
    expect(artifact.content).toContain("<!doctype html>");
    expect(artifact.content).toContain("Collateral Impact Worksheet");
    expect(artifact.content).toContain("Canonical UTA sample");
    expect(artifact.content).toContain("Current margin ratio</span><strong>94.44%</strong>");
    expect(artifact.content).toContain("Projected margin ratio</span><strong>100.00%</strong>");
    expect(artifact.content).toContain("$28,333.34");
    expect(artifact.content).toContain("Engine v0.1.0");
    expect(artifact.content).toContain("window.print()");
    expect(artifact.content).toMatch(/positions held constant/i);
    expect(artifact.content).not.toMatch(/api[_ -]?key|secret|passphrase|private note/i);
  });

  it("escapes untrusted worksheet labels and URLs", () => {
    const change = sampleScenario.event.change;
    const trace = calculateImpact({
      baseline: sampleScenario.account,
      changes: [{
        asset: change.asset,
        grossUsdBefore: sampleScenario.account.holdingsUsd[change.asset]!,
        grossUsdAfter: sampleScenario.account.holdingsUsd[change.asset]!,
        oldTiers: change.before,
        newTiers: change.after,
      }],
    });

    const artifact = createImpactWorksheetArtifact({
      accountLabel: "<img src=x onerror=alert(1)>",
      event: {
        ...sampleScenario.event,
        title: "<script>alert(1)</script>",
        sourceUrl: "javascript:alert(1)",
      },
      targetRatio: "0.75",
      bufferUsd: "28333.34",
      trace,
      generatedAt: "2026-09-18T09:45:00.000Z",
    });

    expect(artifact.content).not.toContain("<script>alert(1)</script>");
    expect(artifact.content).not.toContain("<img src=x");
    expect(artifact.content).not.toContain('href="javascript:');
    expect(artifact.content).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});

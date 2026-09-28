import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";

import {
  extractAnnouncementWithQwen,
  scoreExtractionEnvelope,
  type ExtractionScore,
} from "../src/qwen-extraction.js";

type EvaluationFixture = {
  id: string;
  expectedOutcome: "accepted" | "rejected";
  source: {
    url: string;
    title: string;
    publishedAt: string | null;
    effectiveAt: string;
    timezone: string;
    sourceHash: string;
  };
  sourceText: string;
  golden?: unknown;
};

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function loadFixtures(directory: string): EvaluationFixture[] {
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => JSON.parse(
      readFileSync(join(directory, name), "utf8"),
    ) as EvaluationFixture);
}

function fixtureFingerprint(fixture: EvaluationFixture): string {
  return `sha256:${createHash("sha256")
    .update(JSON.stringify(fixture))
    .digest("hex")}`;
}

async function main(): Promise<void> {
  const apiKey = requiredEnvironment("QWEN_API_KEY");
  const fixturesDirectory = resolve("test/fixtures/announcements");
  const outputPath = resolve(
    process.env.QWEN_EVAL_OUTPUT
      ?? "../../outputs/uta-risk-desk/qwen-evaluation.json",
  );
  let fixtures = loadFixtures(fixturesDirectory);
  const cliArguments = process.argv.slice(2);
  const resume = cliArguments.includes("--resume");
  const requestedIds = [
    ...cliArguments.filter((value) => value !== "--resume"),
    ...(process.env.QWEN_EVAL_FIXTURE_IDS ?? "").split(","),
  ]
    .map((value) => value.trim())
    .filter(Boolean);
  if (requestedIds.length > 0) {
    const requestedSet = new Set(requestedIds);
    fixtures = fixtures.filter((fixture) => requestedSet.has(fixture.id));
    if (fixtures.length !== requestedSet.size) {
      throw new Error("QWEN_EVAL_FIXTURE_IDS contains an unknown fixture id");
    }
  }
  const timeoutMs = Number(process.env.QWEN_EVAL_TIMEOUT_MS ?? "120000");
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1_000) {
    throw new Error("QWEN_EVAL_TIMEOUT_MS must be a finite number of at least 1000");
  }
  const maxOutputTokens = Number(process.env.QWEN_EVAL_MAX_OUTPUT_TOKENS ?? "5000");
  if (!Number.isFinite(maxOutputTokens) || maxOutputTokens < 200) {
    throw new Error("QWEN_EVAL_MAX_OUTPUT_TOKENS must be a finite number of at least 200");
  }
  let scores: ExtractionScore[] = [];
  const fixtureFingerprints = Object.fromEntries(
    fixtures.map((fixture) => [fixture.id, fixtureFingerprint(fixture)]),
  );
  if (resume && existsSync(outputPath)) {
    const previous = JSON.parse(readFileSync(outputPath, "utf8")) as {
      scores?: ExtractionScore[];
      fixtureFingerprints?: Record<string, string>;
    };
    const fixtureIds = new Set(fixtures.map((fixture) => fixture.id));
    scores = (previous.scores ?? []).filter(
      (score) => score.passed
        && fixtureIds.has(score.fixtureId)
        && previous.fixtureFingerprints?.[score.fixtureId]
          === fixtureFingerprints[score.fixtureId],
    );
  }
  const completedIds = new Set(scores.map((score) => score.fixtureId));

  for (const fixture of fixtures) {
    if (completedIds.has(fixture.id)) continue;
    try {
      const envelope = await extractAnnouncementWithQwen({
        apiKey,
        source: fixture.source,
        sourceText: fixture.sourceText,
        timeoutMs,
        maxOutputTokens,
      });
      scores.push(scoreExtractionEnvelope(envelope, fixture));
    } catch (error) {
      scores.push({
        fixtureId: fixture.id,
        passed: false,
        outcomeCorrect: false,
        sourceCorrect: false,
        changesExact: false,
        unsupportedCorrect: false,
        validationErrors: [
          error instanceof Error ? error.message : "unknown extraction failure",
        ],
      });
    }
  }
  const fixtureOrder = new Map(
    fixtures.map((fixture, index) => [fixture.id, index]),
  );
  scores.sort((left, right) => (
    (fixtureOrder.get(left.fixtureId) ?? 0) - (fixtureOrder.get(right.fixtureId) ?? 0)
  ));

  const supportedIds = new Set(fixtures
    .filter((fixture) => fixture.expectedOutcome === "accepted")
    .map((fixture) => fixture.id));
  const rejectedIds = new Set(fixtures
    .filter((fixture) => fixture.expectedOutcome === "rejected")
    .map((fixture) => fixture.id));
  const supportedScores = scores.filter((score) => supportedIds.has(score.fixtureId));
  const rejectedScores = scores.filter((score) => rejectedIds.has(score.fixtureId));
  const supportedPasses = supportedScores.filter((score) => score.passed).length;
  const rejectionPasses = rejectedScores.filter((score) => score.passed).length;
  const supportedAccuracy = supportedScores.length === 0
    ? 0
    : supportedPasses / supportedScores.length;
  const rejectionAccuracy = rejectedScores.length === 0
    ? 0
    : rejectionPasses / rejectedScores.length;

  const report = {
    schemaVersion: "1",
    model: "qwen3.8-max",
    promptVersion: "announcement-extraction-v1",
    validatorVersion: "parameter-change-v1",
    createdAt: new Date().toISOString(),
    fixtureFingerprints,
    fixtureCount: fixtures.length,
    supportedCount: supportedScores.length,
    rejectedCount: rejectedScores.length,
    supportedAccuracy,
    rejectionAccuracy,
    releaseThreshold: {
      supportedAccuracy: 0.9,
      rejectionAccuracy: 1,
    },
    releasePassed: supportedAccuracy >= 0.9 && rejectionAccuracy === 1,
    scores,
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(JSON.stringify({
    outputPath,
    fixtureCount: report.fixtureCount,
    supportedAccuracy,
    rejectionAccuracy,
    releasePassed: report.releasePassed,
  }, null, 2));
  process.stdout.write("\n");
  if (!report.releasePassed) process.exitCode = 2;
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown error";
  process.stderr.write(`Qwen evaluation failed: ${message}\n`);
  process.exitCode = 1;
}

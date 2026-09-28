import { Decimal } from "decimal.js";

import type { TierInput } from "./index.js";

export type ParameterChange = {
  schemaVersion: "1";
  source: {
    url: string;
    title: string;
    publishedAt: string | null;
    effectiveAt: string;
    timezone: string;
    sourceHash: string;
  };
  changes: Array<{
    asset: string;
    parameter: "collateral_ratio" | "maintenance_margin";
    unit: "USD";
    before: TierInput[];
    after: TierInput[];
  }>;
  unsupportedStatements: string[];
  extraction: {
    model: string;
    createdAt: string;
    confidence: "high" | "medium" | "low";
  };
};

export type ParameterChangeContext = {
  sourceUrl: string;
  sourceHash: string;
  sourceText: string;
};

export class ParameterChangeValidationError extends Error {
  override readonly name = "ParameterChangeValidationError";

  constructor(readonly issues: string[]) {
    super(issues.join("; "));
  }
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactFields(
  value: UnknownRecord,
  allowed: readonly string[],
  path: string,
  issues: string[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) issues.push(`${path}: unknown field ${key}`);
  }
  for (const key of allowed) {
    if (!(key in value)) issues.push(`${path}: missing field ${key}`);
  }
}

function requiredString(
  value: unknown,
  path: string,
  issues: string[],
): value is string {
  if (typeof value !== "string" || value.trim() === "") {
    issues.push(`${path} must be a non-empty string`);
    return false;
  }
  return true;
}

function explicitTimestamp(value: unknown, path: string, issues: string[]): void {
  if (!requiredString(value, path, issues)) return;
  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) {
    issues.push(`${path} must be an ISO timestamp with an explicit timezone`);
  }
}

function canonicalNumber(value: string): string | null {
  try {
    const number = new Decimal(value);
    if (!number.isFinite()) return null;
    return number.isZero() ? "0" : number.toFixed();
  } catch {
    return null;
  }
}

function sourceNumbers(sourceText: string): Set<string> {
  const found = new Set<string>();
  const tokens = sourceText.match(/\d[\d,]*(?:\.\d+)?%?/g) ?? [];
  for (const token of tokens) {
    const percent = token.endsWith("%");
    const raw = token.replaceAll(",", "").replace("%", "");
    const normalized = canonicalNumber(raw);
    if (normalized !== null) {
      found.add(normalized);
      if (percent) found.add(new Decimal(normalized).div(100).toFixed());
    }
  }
  return found;
}

function validateTierSchedule(
  value: unknown,
  path: string,
  evidence: Set<string>,
  issues: string[],
): void {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push(`${path} must be a non-empty tier array`);
    return;
  }

  let expectedStart = new Decimal(0);
  value.forEach((rawTier, index) => {
    const tierPath = `${path}[${index}]`;
    if (!isRecord(rawTier)) {
      issues.push(`${tierPath} must be an object`);
      return;
    }
    exactFields(rawTier, ["startUsd", "endUsd", "rate"], tierPath, issues);

    const startText = rawTier.startUsd;
    const rateText = rawTier.rate;
    if (!requiredString(startText, `${tierPath}.startUsd`, issues)
      || !requiredString(rateText, `${tierPath}.rate`, issues)) return;

    const startCanonical = canonicalNumber(startText);
    const rateCanonical = canonicalNumber(rateText);
    if (startCanonical === null || new Decimal(startCanonical).isNegative()) {
      issues.push(`${tierPath}.startUsd must be a non-negative decimal string`);
      return;
    }
    if (rateCanonical === null
      || new Decimal(rateCanonical).lt(0)
      || new Decimal(rateCanonical).gt(1)) {
      issues.push(`${tierPath}.rate must be a decimal string between zero and one`);
      return;
    }
    if (!new Decimal(startCanonical).eq(expectedStart)) {
      issues.push(`${tierPath} creates a tier gap or overlap`);
    }
    if (!evidence.has(startCanonical)) {
      issues.push(`${tierPath}.startUsd is not evidenced by source text`);
    }
    if (!evidence.has(rateCanonical)) {
      issues.push(`${tierPath}.rate is not evidenced by source text`);
    }

    if (rawTier.endUsd === null) {
      if (index !== value.length - 1) {
        issues.push(`${tierPath}: only the final tier may be unbounded`);
      }
      return;
    }
    if (!requiredString(rawTier.endUsd, `${tierPath}.endUsd`, issues)) return;
    const endCanonical = canonicalNumber(rawTier.endUsd);
    if (endCanonical === null || new Decimal(endCanonical).lte(startCanonical)) {
      issues.push(`${tierPath}.endUsd must exceed startUsd`);
      return;
    }
    if (!evidence.has(endCanonical)) {
      issues.push(`${tierPath}.endUsd is not evidenced by source text`);
    }
    expectedStart = new Decimal(endCanonical);
  });

  const finalTier = value.at(-1);
  if (isRecord(finalTier) && finalTier.endUsd !== null) {
    issues.push(`${path}: final tier must be unbounded`);
  }
}

export function validateParameterChangeCandidate(
  candidate: unknown,
  context: ParameterChangeContext,
): ParameterChange {
  const issues: string[] = [];
  if (!isRecord(candidate)) {
    throw new ParameterChangeValidationError(["candidate must be an object"]);
  }

  exactFields(
    candidate,
    ["schemaVersion", "source", "changes", "unsupportedStatements", "extraction"],
    "candidate",
    issues,
  );
  if (candidate.schemaVersion !== "1") issues.push("schemaVersion must equal 1");

  if (!isRecord(candidate.source)) {
    issues.push("source must be an object");
  } else {
    exactFields(
      candidate.source,
      ["url", "title", "publishedAt", "effectiveAt", "timezone", "sourceHash"],
      "source",
      issues,
    );
    requiredString(candidate.source.title, "source.title", issues);
    requiredString(candidate.source.timezone, "source.timezone", issues);
    explicitTimestamp(candidate.source.effectiveAt, "source.effectiveAt", issues);
    if (candidate.source.publishedAt !== null) {
      explicitTimestamp(candidate.source.publishedAt, "source.publishedAt", issues);
    }
    if (candidate.source.url !== context.sourceUrl
      || candidate.source.sourceHash !== context.sourceHash) {
      issues.push("source binding does not match the server-supplied URL and hash");
    }
  }

  const evidence = sourceNumbers(context.sourceText);
  if (!Array.isArray(candidate.changes) || candidate.changes.length === 0) {
    issues.push("changes must be a non-empty array");
  } else {
    candidate.changes.forEach((rawChange, index) => {
      const path = `changes[${index}]`;
      if (!isRecord(rawChange)) {
        issues.push(`${path} must be an object`);
        return;
      }
      exactFields(
        rawChange,
        ["asset", "parameter", "unit", "before", "after"],
        path,
        issues,
      );
      requiredString(rawChange.asset, `${path}.asset`, issues);
      if (rawChange.parameter !== "collateral_ratio"
        && rawChange.parameter !== "maintenance_margin") {
        issues.push(`${path}.parameter is unsupported`);
      }
      if (rawChange.unit !== "USD") issues.push(`${path}.unit must equal USD`);
      validateTierSchedule(rawChange.before, `${path}.before`, evidence, issues);
      validateTierSchedule(rawChange.after, `${path}.after`, evidence, issues);
    });
  }

  if (!Array.isArray(candidate.unsupportedStatements)
    || candidate.unsupportedStatements.some((item) => typeof item !== "string")) {
    issues.push("unsupportedStatements must be an array of strings");
  }

  if (!isRecord(candidate.extraction)) {
    issues.push("extraction must be an object");
  } else {
    exactFields(candidate.extraction, ["model", "createdAt", "confidence"], "extraction", issues);
    requiredString(candidate.extraction.model, "extraction.model", issues);
    explicitTimestamp(candidate.extraction.createdAt, "extraction.createdAt", issues);
    if (!["high", "medium", "low"].includes(String(candidate.extraction.confidence))) {
      issues.push("extraction.confidence is unsupported");
    }
  }

  if (issues.length > 0) throw new ParameterChangeValidationError(issues);
  return candidate as ParameterChange;
}

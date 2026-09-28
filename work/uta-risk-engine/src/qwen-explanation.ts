import type { RiskBand } from "./index.js";
import { requestQwenText } from "./qwen-transport.js";

export type ImpactExplanationFacts = {
  eventTitle: string;
  asset: string;
  beforeRate: string;
  afterRate: string;
  effectiveEquityDeltaUsd: string;
  currentMarginRatio: string;
  projectedMarginRatio: string;
  currentRiskBand: RiskBand;
  projectedRiskBand: RiskBand;
  targetRatio: string;
  bufferUsd: string;
};

export type ImpactExplanationResult = {
  mode: "live_qwen" | "deterministic_fallback";
  text: string;
  fallbackReason: string | null;
};

export type ExplainImpactInput = {
  apiKey: string;
  facts: ImpactExplanationFacts;
  fetchImpl?: typeof fetch | undefined;
  sleepImpl?: ((milliseconds: number) => Promise<void>) | undefined;
  baseUrl?: string | undefined;
  timeoutMs?: number | undefined;
  maxAttempts?: number | undefined;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function money(value: string, absolute = false): string {
  const amount = Number(value);
  const formatted = currency.format(absolute ? Math.abs(amount) : amount);
  return formatted.replace("-$", "−$");
}

function percent(value: string): string {
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function wholePercent(value: string): string {
  return `${(Number(value) * 100).toFixed(0)}%`;
}

function fallbackExplanation(facts: ImpactExplanationFacts): string {
  const delta = Number(facts.effectiveEquityDeltaUsd);
  const direction = delta < 0 ? "reduces" : delta > 0 ? "increases" : "does not change";
  return [
    `${facts.asset}'s collateral schedule changes from ${wholePercent(facts.beforeRate)} to ${wholePercent(facts.afterRate)}.`,
    `That ${direction} effective equity by ${money(facts.effectiveEquityDeltaUsd, true)}, moving the margin ratio from ${percent(facts.currentMarginRatio)} to ${percent(facts.projectedMarginRatio)} and the account from ${facts.currentRiskBand} to ${facts.projectedRiskBand}.`,
    `The ${money(facts.bufferUsd)} buffer is the estimated top-up required to reach the ${wholePercent(facts.targetRatio)} target while positions, orders, liabilities and the fee residual remain constant.`,
    "This is an estimate; you decide whether to act.",
  ].join(" ");
}

function promptFor(facts: ImpactExplanationFacts): string {
  return [
    "Explain this completed deterministic risk calculation in one short paragraph.",
    "Use only the facts and exact display numbers below. Do not calculate or introduce any other number.",
    "Do not tell the user to buy, sell, close, deposit, borrow, hedge, or take any action.",
    "State that positions, orders, liabilities and fee residual are held constant.",
    "End by saying this is an estimate and the user decides whether to act.",
    `Event: ${facts.eventTitle}`,
    `Asset: ${facts.asset}`,
    `Collateral schedule: ${wholePercent(facts.beforeRate)} to ${wholePercent(facts.afterRate)}`,
    `Effective equity change: ${money(facts.effectiveEquityDeltaUsd)}`,
    `Current margin ratio: ${percent(facts.currentMarginRatio)}`,
    `Projected margin ratio: ${percent(facts.projectedMarginRatio)}`,
    `Risk band: ${facts.currentRiskBand} to ${facts.projectedRiskBand}`,
    `Target ratio: ${wholePercent(facts.targetRatio)}`,
    `Estimated buffer: ${money(facts.bufferUsd)}`,
  ].join("\n");
}

function normalizedNumericToken(value: string): string {
  return value.replace(/,/g, "").replace(/\$/g, "").replace(/−/g, "-");
}

function validateExplanation(text: string, facts: ImpactExplanationFacts): string[] {
  const issues: string[] = [];
  const trimmed = text.trim();
  if (trimmed.length < 80 || trimmed.length > 1_200) {
    issues.push("explanation length is outside the allowed range");
  }
  if (/\b(?:buy|sell|close|deposit|borrow|hedge|guarantee|guaranteed)\b|\bshould\b|\bwill prevent\b/i.test(trimmed)) {
    issues.push("explanation contains directive or certainty language");
  }

  const requiredFacts = [
    facts.asset,
    wholePercent(facts.beforeRate),
    wholePercent(facts.afterRate),
    percent(facts.currentMarginRatio),
    percent(facts.projectedMarginRatio),
    facts.currentRiskBand,
    facts.projectedRiskBand,
    wholePercent(facts.targetRatio),
    money(facts.bufferUsd),
  ];
  for (const fact of requiredFacts) {
    if (!trimmed.toLowerCase().includes(fact.toLowerCase())) {
      issues.push(`required fact is missing: ${fact}`);
    }
  }
  if (!/(?:held|remain)[- ]constant/i.test(trimmed)) {
    issues.push("held-constant assumptions are missing");
  }
  if (!/\bestimate\b/i.test(trimmed) || !/\b(?:you|user) decides?\b/i.test(trimmed)) {
    issues.push("estimate or human-decision limitation is missing");
  }

  const approvedDisplays = [
    wholePercent(facts.beforeRate),
    wholePercent(facts.afterRate),
    percent(facts.currentMarginRatio),
    percent(facts.projectedMarginRatio),
    wholePercent(facts.targetRatio),
    money(facts.effectiveEquityDeltaUsd),
    money(facts.effectiveEquityDeltaUsd, true),
    money(facts.bufferUsd),
  ];
  const approved = new Set(approvedDisplays.map(normalizedNumericToken));
  const tokens = trimmed.match(/[−-]?\$?\d[\d,]*(?:\.\d+)?%?/g) ?? [];
  for (const token of tokens) {
    if (!approved.has(normalizedNumericToken(token))) {
      issues.push(`unapproved numeric token: ${token}`);
    }
  }
  return [...new Set(issues)];
}

function qwenFailureCode(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  if (error instanceof TypeError) return "network";
  if (error instanceof Error) {
    const status = error.message.match(/HTTP (\d{3})/)?.[1];
    if (status) return `http_${status}`;
  }
  return "unknown";
}

function logQwenFailure(stage: "initial" | "repair", error: unknown): void {
  console.warn(JSON.stringify({
    event: "qwen_transport_failure",
    stage,
    reason: qwenFailureCode(error),
  }));
}

export async function explainImpactWithQwen(
  input: ExplainImpactInput,
): Promise<ImpactExplanationResult> {
  const fallback = fallbackExplanation(input.facts);
  if (input.apiKey.trim() === "") {
    return {
      mode: "deterministic_fallback",
      text: fallback,
      fallbackReason: "Qwen is not configured; showing the validated desk explanation.",
    };
  }

  const instructions = "You explain an already-computed financial risk scenario. Never calculate, recommend an action, or introduce a number that is not supplied.";
  const basePrompt = promptFor(input.facts);
  const request = (prompt: string) => requestQwenText({
    apiKey: input.apiKey,
    instructions,
    prompt,
    fetchImpl: input.fetchImpl,
    sleepImpl: input.sleepImpl,
    baseUrl: input.baseUrl,
    timeoutMs: input.timeoutMs ?? 20_000,
    maxOutputTokens: 600,
    maxAttempts: input.maxAttempts,
  });

  let content: string;
  try {
    content = await request(basePrompt);
  } catch (error) {
    logQwenFailure("initial", error);
    return {
      mode: "deterministic_fallback",
      text: fallback,
      fallbackReason: "Qwen was unavailable after bounded retries; showing the validated desk explanation.",
    };
  }

  let issues = validateExplanation(content, input.facts);
  if (issues.length === 0) {
    return { mode: "live_qwen", text: content.trim(), fallbackReason: null };
  }

  try {
    content = await request([
      basePrompt,
      "<REPAIR_REQUEST>",
      `The previous explanation failed validation: ${issues.join("; ")}`,
      "Return a corrected paragraph only.",
      "</REPAIR_REQUEST>",
    ].join("\n"));
  } catch (error) {
    logQwenFailure("repair", error);
    return {
      mode: "deterministic_fallback",
      text: fallback,
      fallbackReason: "Qwen repair was unavailable; showing the validated desk explanation.",
    };
  }

  issues = validateExplanation(content, input.facts);
  if (issues.length === 0) {
    return { mode: "live_qwen", text: content.trim(), fallbackReason: null };
  }
  return {
    mode: "deterministic_fallback",
    text: fallback,
    fallbackReason: "Qwen output failed grounding checks twice; showing the validated desk explanation.",
  };
}

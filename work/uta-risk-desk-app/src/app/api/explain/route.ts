import { NextResponse } from "next/server";

import {
  calculateImpact,
  classifyRisk,
  scenarioBuffer,
} from "@risk-engine";
import { explainImpactWithQwen } from "@risk-engine/server";

import { sampleAccounts, sampleEvents } from "../../../data/sample-scenario";

export const runtime = "nodejs";
export const maxDuration = 60;

type ExplainRequest = {
  eventId: string;
  accountId: string;
  targetRatio: string;
};

const allowedTargets = new Set(["0.65", "0.75", "0.8"]);
const maxRequestBytes = 1_024;
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 8;
const maxRateLimitBuckets = 4_096;
const responseCache = new Map<string, { expiresAt: number; value: Awaited<ReturnType<typeof explainImpactWithQwen>> }>();
const inFlight = new Map<string, Promise<Awaited<ReturnType<typeof explainImpactWithQwen>>>>();
const rateLimitBuckets = new Map<string, { count: number; startedAt: number }>();

class RequestBodyError extends Error {
  constructor(
    readonly status: 400 | 413,
    message: string,
  ) {
    super(message);
  }
}

function json(
  value: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): NextResponse {
  return NextResponse.json(value, {
    status: init.status,
    headers: {
      "cache-control": "private, no-store",
      ...init.headers,
    },
  });
}

function expectedOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host")
    ?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host") || url.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")
    ?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || url.protocol.replace(":", "");
  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return url.origin;
  }
}

function hasAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  try {
    return new URL(origin).origin === expectedOrigin(request);
  } catch {
    return false;
  }
}

function hasJsonContentType(request: Request): boolean {
  const mediaType = request.headers.get("content-type")
    ?.split(";")[0]?.trim().toLowerCase();
  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

function clientIdentifier(request: Request): string {
  const value = request.headers.get("x-forwarded-for")
    ?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "anonymous";
  return /^[0-9a-f:.]{1,64}$/i.test(value) ? value : "anonymous";
}

function checkRateLimit(
  request: Request,
  now = Date.now(),
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  if (rateLimitBuckets.size >= maxRateLimitBuckets) {
    for (const [key, bucket] of rateLimitBuckets) {
      if (now - bucket.startedAt >= rateLimitWindowMs) rateLimitBuckets.delete(key);
    }
  }

  let key = clientIdentifier(request);
  if (!rateLimitBuckets.has(key) && rateLimitBuckets.size >= maxRateLimitBuckets) {
    key = "overflow";
  }
  const current = rateLimitBuckets.get(key);
  if (!current || now - current.startedAt >= rateLimitWindowMs) {
    rateLimitBuckets.set(key, { count: 1, startedAt: now });
    return { allowed: true };
  }
  if (current.count >= rateLimitMaxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((rateLimitWindowMs - (now - current.startedAt)) / 1_000),
      ),
    };
  }
  current.count += 1;
  return { allowed: true };
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const advertisedLength = request.headers.get("content-length");
  if (advertisedLength !== null) {
    if (!/^\d+$/.test(advertisedLength)) {
      throw new RequestBodyError(400, "Request content length is invalid.");
    }
    if (Number(advertisedLength) > maxRequestBytes) {
      throw new RequestBodyError(413, "Request body is too large.");
    }
  }
  if (!request.body) throw new RequestBodyError(400, "Request body must be valid JSON.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxRequestBytes) {
        await reader.cancel();
        throw new RequestBodyError(413, "Request body is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return JSON.parse(text) as unknown;
  } catch {
    throw new RequestBodyError(400, "Request body must be valid JSON.");
  }
}

function parseRequest(value: unknown): ExplainRequest | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).sort().join(",") !== "accountId,eventId,targetRatio") return null;
  if (typeof record.eventId !== "string"
    || typeof record.accountId !== "string"
    || typeof record.targetRatio !== "string"
    || !allowedTargets.has(record.targetRatio)) return null;
  return {
    eventId: record.eventId,
    accountId: record.accountId,
    targetRatio: record.targetRatio,
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!hasAllowedOrigin(request)) {
    return json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  }
  if (!hasJsonContentType(request)) {
    return json({ error: "Content-Type must be application/json." }, { status: 415 });
  }
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) {
    return json({ error: "Too many explanation requests. Try again shortly." }, {
      status: 429,
      headers: { "retry-after": String(rateLimit.retryAfterSeconds) },
    });
  }

  let body: unknown;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return json({ error: error.message }, { status: error.status });
    }
    return json({ error: "Request body could not be read." }, { status: 400 });
  }
  const input = parseRequest(body);
  if (!input) {
    return json({ error: "Invalid explanation request." }, { status: 400 });
  }
  const event = sampleEvents.find((candidate) => candidate.id === input.eventId);
  const account = sampleAccounts.find((candidate) => candidate.id === input.accountId);
  if (!event || !account) {
    return json({ error: "Unknown reviewed fixture." }, { status: 404 });
  }
  if (account.freshnessStatus !== "fresh") {
    return json({ error: "Stale snapshots cannot be explained." }, { status: 409 });
  }
  const grossUsd = account.holdingsUsd[event.change.asset];
  if (!grossUsd) {
    return json({ error: "The account has no matching reviewed holding." }, { status: 422 });
  }

  const trace = calculateImpact({
    baseline: account,
    changes: [{
      asset: event.change.asset,
      grossUsdBefore: grossUsd,
      grossUsdAfter: grossUsd,
      oldTiers: event.change.before,
      newTiers: event.change.after,
    }],
  });
  const bufferUsd = scenarioBuffer({
    numeratorUsd: trace.result.projectedNumeratorUsd,
    effectiveEquityUsd: trace.result.projectedEffectiveEquityUsd,
    targetRatio: input.targetRatio,
    settlementDecimals: 2,
  });
  const key = `${event.id}:${account.id}:${input.targetRatio}:${event.sourceHash}`;
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return json(cached.value);
  }

  let pending = inFlight.get(key);
  if (!pending) {
    pending = explainImpactWithQwen({
      apiKey: process.env.QWEN_API_KEY ?? "",
      facts: {
        eventTitle: event.title,
        asset: event.change.asset,
        beforeRate: event.change.before[0]!.rate,
        afterRate: event.change.after[0]!.rate,
        effectiveEquityDeltaUsd: trace.result.collateralDeltaUsd,
        currentMarginRatio: trace.baseline.suppliedMarginRatio,
        projectedMarginRatio: trace.result.projectedMarginRatio!,
        currentRiskBand: classifyRisk(trace.baseline.suppliedMarginRatio),
        projectedRiskBand: trace.result.riskBand,
        targetRatio: input.targetRatio,
        bufferUsd,
      },
      timeoutMs: 25_000,
      maxAttempts: 1,
    });
    inFlight.set(key, pending);
  }

  try {
    const result = await pending;
    if (result.mode === "live_qwen") {
      responseCache.set(key, { expiresAt: Date.now() + 5 * 60_000, value: result });
    } else if ((process.env.QWEN_API_KEY ?? "").trim() !== "") {
      console.warn(JSON.stringify({
        event: "qwen_explanation_fallback",
        reason: "validated_fallback",
      }));
    }
    return json(result);
  } catch {
    console.error(JSON.stringify({
      event: "explanation_route_failure",
      reason: "unexpected_exception",
    }));
    return json({ error: "Explanation service is temporarily unavailable." }, { status: 503 });
  } finally {
    if (inFlight.get(key) === pending) inFlight.delete(key);
  }
}

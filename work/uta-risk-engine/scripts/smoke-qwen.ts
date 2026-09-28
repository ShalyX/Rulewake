import { extractAnnouncementWithQwen } from "../src/qwen-extraction.js";

const apiKey = process.env.QWEN_API_KEY;
if (typeof apiKey !== "string" || apiKey.trim() === "") {
  throw new Error("QWEN_API_KEY is not configured");
}

const startedAt = Date.now();
const result = await extractAnnouncementWithQwen({
  apiKey,
  source: {
    url: "https://www.bitget.com/support/articles/smoke-test",
    title: "Incomplete smoke-test source",
    publishedAt: null,
    effectiveAt: "2026-09-17T00:00:00Z",
    timezone: "UTC",
    sourceHash: "sha256:smoke-test",
  },
  sourceText: "This source contains no asset, date, or before/after schedule.",
  timeoutMs: 30_000,
  maxOutputTokens: 200,
});

process.stdout.write(JSON.stringify({
  elapsedMs: Date.now() - startedAt,
  status: result.status,
}, null, 2));
process.stdout.write("\n");

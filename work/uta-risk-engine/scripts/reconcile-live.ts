import { fetchBitgetReconciliationInputs } from "../src/bitget-client.js";
import { buildBitgetReconciliationReport } from "../src/bitget-reconciliation.js";

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

async function main(): Promise<void> {
  const credentials = {
    apiKey: requiredEnvironment("BITGET_API_KEY"),
    secretKey: requiredEnvironment("BITGET_SECRET_KEY"),
    passphrase: requiredEnvironment("BITGET_PASSPHRASE"),
    demo: process.env.BITGET_DEMO === "true",
  };

  const responses = await fetchBitgetReconciliationInputs(credentials);
  const report = buildBitgetReconciliationReport({
    ...responses,
    nowMs: Date.now(),
    maxAgeMs: 30_000,
  });

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.eligibleForProjection) {
    process.exitCode = 2;
  }
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown error";
  process.stderr.write(`Reconciliation failed: ${message}\n`);
  process.exitCode = 1;
}

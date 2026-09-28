import type {
  BitgetAccountAssetsResponse,
  BitgetAccountSettingsResponse,
} from "../src/bitget-reconciliation.js";
import { buildBitgetReconciliationReport } from "../src/bitget-reconciliation.js";

type ReconciliationInput = {
  assetsResponse: BitgetAccountAssetsResponse;
  settingsResponse: BitgetAccountSettingsResponse;
};

let input = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) {
  input += chunk;
}

try {
  const responses = JSON.parse(input) as ReconciliationInput;
  const report = buildBitgetReconciliationReport({
    ...responses,
    nowMs: Date.now(),
    maxAgeMs: 30_000,
  });
  process.stdout.write(`${JSON.stringify(report)}\n`);
  if (!report.eligibleForProjection) process.exitCode = 2;
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown error";
  process.stderr.write(`Reconciliation failed: ${message}\n`);
  process.exitCode = 1;
}

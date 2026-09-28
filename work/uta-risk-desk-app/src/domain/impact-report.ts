import type { ImpactTrace } from "@risk-engine";

export type ImpactReportInput = {
  accountLabel?: string;
  event: {
    title: string;
    sourceUrl: string;
    effectiveAt: string;
  };
  targetRatio: string;
  bufferUsd: string;
  trace: ImpactTrace;
  generatedAt?: string;
};

export type ImpactWorksheetArtifact = {
  filename: string;
  mimeType: "text/html;charset=utf-8";
  content: string;
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function money(value: string): string {
  const amount = Number(value);
  const formatted = currency.format(Math.abs(amount));
  return amount < 0 ? `−${formatted}` : formatted;
}

function percentage(value: string): string {
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function targetPercentage(value: string): string {
  return `${(Number(value) * 100).toFixed(0)}%`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeSourceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function dateLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date) + " UTC";
}

export function buildImpactReport(input: ImpactReportInput): string {
  const change = input.trace.changes[0];
  if (!change) throw new Error("impact report requires at least one calculation change");

  return [
    "UTA RISK CHANGE DESK — IMPACT REPORT",
    "",
    `Event: ${input.event.title}`,
    `Effective: ${input.event.effectiveAt}`,
    `Source: ${input.event.sourceUrl}`,
    "Source status: human-reviewed fixture",
    "",
    "RESULT",
    `Asset: ${change.asset}`,
    `Collateral contribution: ${money(change.oldContributionUsd)} → ${money(change.newContributionUsd)}`,
    `Effective equity change: ${money(input.trace.result.collateralDeltaUsd)}`,
    `Projected effective equity: ${money(input.trace.result.projectedEffectiveEquityUsd)}`,
    `Projected margin ratio: ${percentage(input.trace.result.projectedMarginRatio ?? "0")}`,
    `Projected risk band: ${input.trace.result.riskBand}`,
    `Buffer to ${targetPercentage(input.targetRatio)} target: ${money(input.bufferUsd)}`,
    "",
    "ASSUMPTIONS",
    "Positions held constant",
    "Open orders held constant",
    "Liabilities held constant",
    "Fee residual held constant",
    "",
    "Decision support only. No trades were executed.",
  ].join("\n");
}

export function createImpactWorksheetArtifact(input: ImpactReportInput): ImpactWorksheetArtifact {
  const change = input.trace.changes[0];
  if (!change) throw new Error("impact worksheet requires at least one calculation change");
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const safeUrl = safeSourceUrl(input.event.sourceUrl);
  const source = safeUrl
    ? `<a href="${escapeHtml(safeUrl)}" rel="noreferrer">${escapeHtml(safeUrl)}</a>`
    : `<span>${escapeHtml(input.event.sourceUrl)}</span>`;
  const baselineRatio = input.trace.baseline.suppliedMarginRatio === ""
    ? "unknown"
    : input.trace.baseline.suppliedMarginRatio;
  const filenameDate = /^\d{4}-\d{2}-\d{2}/.exec(generatedAt)?.[0] ?? "undated";
  const assetSlug = change.asset.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "asset";

  const content = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="data:,">
  <title>Collateral Impact Worksheet — ${escapeHtml(change.asset)}</title>
  <style>
    :root{color-scheme:light;--ink:#101a19;--muted:#61706d;--paper:#f4f1e9;--line:#d9d8cf;--teal:#006c62;--acid:#c5ee6a;--critical:#b9342d}*{box-sizing:border-box}body{margin:0;color:var(--ink);background:var(--paper);font:14px/1.5 Inter,ui-sans-serif,system-ui,sans-serif}.sheet{width:min(920px,calc(100% - 32px));margin:32px auto;background:white;border:1px solid var(--line)}header{padding:34px;border-bottom:5px solid var(--ink)}.kicker{margin:0;color:var(--teal);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}h1{margin:8px 0 4px;font-size:38px;line-height:1;letter-spacing:-.045em}header p:last-child{margin:10px 0 0;color:var(--muted)}main{padding:34px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 28px}.metric{padding:17px;border:1px solid var(--line);background:#faf8f2}.metric span{display:block;color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.metric strong{display:block;margin-top:8px;font-size:23px;font-variant-numeric:tabular-nums}.critical{color:var(--critical)}section{margin-top:28px}h2{margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:.08em}.rows{margin:0;border-top:1px solid var(--line)}.rows div{display:grid;grid-template-columns:210px 1fr;gap:18px;padding:10px 0;border-bottom:1px solid var(--line)}dt{color:var(--muted);font-weight:650}dd{margin:0;font-weight:700;overflow-wrap:anywhere}.assumptions{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0;list-style:none}.assumptions li{padding:12px;border-left:4px solid var(--acid);background:#f1f5e8}.notice{margin-top:28px;padding:15px;color:#37423f;background:#eef1ed}.provenance{color:var(--muted);font-size:12px}.actions{display:flex;justify-content:flex-end;margin:0 auto 32px;width:min(920px,calc(100% - 32px))}.actions button{padding:11px 16px;border:0;color:white;background:var(--teal);font:inherit;font-weight:800;cursor:pointer}@media(max-width:640px){.summary{grid-template-columns:1fr}.rows div{grid-template-columns:1fr;gap:3px}.assumptions{grid-template-columns:1fr}header,main{padding:22px}h1{font-size:31px}}@media print{body{background:white}.sheet{width:100%;margin:0;border:0}.actions{display:none}@page{margin:14mm}}
  </style>
</head>
<body>
  <article class="sheet">
    <header>
      <p class="kicker">Decision support · Reviewed fixture</p>
      <h1>Collateral Impact Worksheet</h1>
      <p>${escapeHtml(input.event.title)} · ${escapeHtml(input.accountLabel ?? "Sample account")}</p>
    </header>
    <main>
      <div class="summary">
        <div class="metric"><span>Current margin ratio</span><strong>${percentage(input.trace.baseline.suppliedMarginRatio)}</strong></div>
        <div class="metric critical"><span>Projected margin ratio</span><strong>${percentage(input.trace.result.projectedMarginRatio ?? "0")}</strong></div>
        <div class="metric"><span>Buffer to ${targetPercentage(input.targetRatio)} target</span><strong>${money(input.bufferUsd)}</strong></div>
      </div>
      <section>
        <h2>Reviewed change</h2>
        <dl class="rows">
          <div><dt>Asset</dt><dd>${escapeHtml(change.asset)}</dd></div>
          <div><dt>Effective</dt><dd>${escapeHtml(dateLabel(input.event.effectiveAt))}</dd></div>
          <div><dt>Source</dt><dd>${source}</dd></div>
          <div><dt>Collateral contribution</dt><dd>${money(change.oldContributionUsd)} → ${money(change.newContributionUsd)}</dd></div>
        </dl>
      </section>
      <section>
        <h2>Deterministic result</h2>
        <dl class="rows">
          <div><dt>Baseline effective equity</dt><dd>${money(input.trace.baseline.effectiveEquityUsd)}</dd></div>
          <div><dt>Effective equity change</dt><dd>${money(input.trace.result.collateralDeltaUsd)}</dd></div>
          <div><dt>Projected effective equity</dt><dd>${money(input.trace.result.projectedEffectiveEquityUsd)}</dd></div>
          <div><dt>Normalized numerator</dt><dd>${money(input.trace.baseline.normalizedNumeratorUsd)}</dd></div>
          <div><dt>Projected risk band</dt><dd>${escapeHtml(input.trace.result.riskBand)}</dd></div>
        </dl>
      </section>
      <section>
        <h2>Held-constant assumptions</h2>
        <ul class="assumptions"><li>Positions held constant</li><li>Open orders held constant</li><li>Liabilities held constant</li><li>Fee residual held constant</li></ul>
      </section>
      <p class="notice">This worksheet is an estimate for decision support. It is not an official liquidation quote, does not guarantee safety, and did not execute a trade.</p>
      <p class="provenance">Generated ${escapeHtml(dateLabel(generatedAt))} · Engine v${escapeHtml(input.trace.engineVersion)} · Baseline ratio ${escapeHtml(baselineRatio)}</p>
    </main>
  </article>
  <div class="actions"><button type="button" onclick="window.print()">Print or save as PDF</button></div>
</body>
</html>`;

  return {
    filename: `collateral-impact-${assetSlug}-${filenameDate}.html`,
    mimeType: "text/html;charset=utf-8",
    content,
  };
}

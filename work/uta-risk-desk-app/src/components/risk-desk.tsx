"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateImpact,
  classifyRisk,
  scenarioBuffer,
  type ImpactTrace,
  type RiskBand,
} from "@risk-engine";

import { sampleAccounts, sampleEvents } from "../data/sample-scenario";
import { createImpactWorksheetArtifact } from "../domain/impact-report";
import { saveAnalysis } from "../domain/analysis-history";
import { CausalField } from "./causal-field";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function formatMoney(value: string): string {
  const number = Number(value);
  const absolute = money.format(Math.abs(number));
  return number < 0 ? `−${absolute}` : absolute;
}

function formatRatio(value: string): string {
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function formatTargetRatio(value: string): string {
  return `${(Number(value) * 100).toFixed(0)}%`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

function bandLabel(band: RiskBand): string {
  return band[0]!.toUpperCase() + band.slice(1);
}

const riskRank: Record<RiskBand, number> = {
  stable: 0,
  watch: 1,
  warning: 2,
  critical: 3,
};

function riskHeadline(before: RiskBand, after: RiskBand): string {
  if (before === after) return `Risk remains ${after}.`;
  if (riskRank[after] < riskRank[before]) return `Risk improves to ${after}.`;
  return `Risk moves to ${after}.`;
}

function tierRate(tiers: { rate: string }[]): string {
  return `${(Number(tiers[0]!.rate) * 100).toFixed(0)}%`;
}

function StatusPill({ band }: { band: RiskBand }) {
  return <span className={`status status--${band}`}>{bandLabel(band)}</span>;
}

type ExplanationState = {
  mode: "live_qwen" | "deterministic_fallback";
  text: string;
  fallbackReason: string | null;
};

export function RiskDesk({ embedded = false }: { embedded?: boolean }) {
  const [eventId, setEventId] = useState(sampleEvents[0]!.id);
  const [accountId, setAccountId] = useState(sampleAccounts[0]!.id);
  const [trace, setTrace] = useState<ImpactTrace | null>(null);
  const [traceOpen, setTraceOpen] = useState(false);
  const [targetRatio, setTargetRatio] = useState("0.75");
  const [explanation, setExplanation] = useState<ExplanationState | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [timeView, setTimeView] = useState(0);
  const [qwenEnabled, setQwenEnabled] = useState(true);
  const [historyEnabled, setHistoryEnabled] = useState(true);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("rulewake.preferences.v1") ?? "{}");
      setQwenEnabled(saved.qwenEnabled !== false);
      setHistoryEnabled(saved.localHistory !== false);
    } catch {}
  }, []);
  const selectedEvent = sampleEvents.find((event) => event.id === eventId) ?? sampleEvents[0]!;
  const selectedAccount = sampleAccounts.find((account) => account.id === accountId) ?? sampleAccounts[0]!;
  const grossUsd = selectedAccount.holdingsUsd[selectedEvent.change.asset] ?? "0";
  const beforeBand = classifyRisk(selectedAccount.marginRatio);
  const canCalculate = selectedAccount.freshnessStatus === "fresh";
  const beforeRate = tierRate(selectedEvent.change.before);
  const afterRate = tierRate(selectedEvent.change.after);

  const buffer = useMemo(() => {
    if (!trace) return null;
    return scenarioBuffer({
      numeratorUsd: trace.result.projectedNumeratorUsd,
      effectiveEquityUsd: trace.result.projectedEffectiveEquityUsd,
      targetRatio,
      settlementDecimals: 2,
    });
  }, [targetRatio, trace]);

  function runCalculation() {
    if (!canCalculate) return;
    const change = selectedEvent.change;
    const result = calculateImpact({
      baseline: {
        effectiveEquityUsd: selectedAccount.effectiveEquityUsd,
        maintenanceMarginUsd: selectedAccount.maintenanceMarginUsd,
        marginRatio: selectedAccount.marginRatio,
      },
      changes: [{
        asset: change.asset,
        grossUsdBefore: grossUsd,
        grossUsdAfter: grossUsd,
        oldTiers: change.before,
        newTiers: change.after,
      }],
    });
    setTrace(result);
    if (historyEnabled) saveAnalysis({
      id: `${selectedEvent.id}:${selectedAccount.id}:${Date.now()}`,
      createdAt: new Date().toISOString(),
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      asset: selectedEvent.change.asset,
      accountLabel: selectedAccount.label,
      beforeRatio: selectedAccount.marginRatio,
      projectedRatio: result.result.projectedMarginRatio!,
      collateralDeltaUsd: result.result.collateralDeltaUsd,
      riskBand: result.result.riskBand,
      engineVersion: result.engineVersion,
    });
    setTraceOpen(false);
    setTimeView(100);
  }

  function exportReport() {
    if (!trace || !buffer) return;
    const artifact = createImpactWorksheetArtifact({
      accountLabel: selectedAccount.label,
      event: {
        title: selectedEvent.title,
        sourceUrl: selectedEvent.sourceUrl,
        effectiveAt: selectedEvent.effectiveAt,
      },
      targetRatio,
      bufferUsd: buffer,
      trace,
    });
    const objectUrl = URL.createObjectURL(new Blob([artifact.content], { type: artifact.mimeType }));
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = artifact.filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }

  function resetResult() {
    setTrace(null);
    setTraceOpen(false);
    setExplanation(null);
    setExplanationLoading(false);
    setTimeView(0);
  }

  async function requestExplanation() {
    if (!trace || explanationLoading || !qwenEnabled) return;
    setExplanationLoading(true);
    setExplanation(null);
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId, accountId, targetRatio }),
      });
      if (!response.ok) throw new Error("explanation route failed");
      const payload = await response.json() as Partial<ExplanationState>;
      if ((payload.mode !== "live_qwen" && payload.mode !== "deterministic_fallback")
        || typeof payload.text !== "string"
        || (payload.fallbackReason !== null && typeof payload.fallbackReason !== "string")) {
        throw new Error("explanation route returned an invalid response");
      }
      setExplanation(payload as ExplanationState);
    } catch {
      setExplanation({
        mode: "deterministic_fallback",
        text: `The validated calculation remains ${formatRatio(trace.result.projectedMarginRatio!)} in the ${trace.result.riskBand} band. Positions, orders, liabilities and the fee residual remain held constant. This is an estimate; you decide whether to act.`,
        fallbackReason: "Qwen route could not be reached; the deterministic result remains available.",
      });
    } finally {
      setExplanationLoading(false);
    }
  }

  function selectEvent(id: string) {
    setEventId(id);
    resetResult();
  }

  function selectAccount(id: string) {
    setAccountId(id);
    resetResult();
  }

  return (
    <>
      {!embedded && <a className="skip-link" href="#main-content">Skip to main content</a>}
      {!embedded && <header className="rulewake-header">
        <div className="rulewake-brand" aria-label="Rulewake">
          <span className="rulewake-mark" aria-hidden="true"><i /><i /><i /></span>
          <strong>RULEWAKE</strong>
          <span>See what the rule changes.</span>
        </div>
        <div className="header-status"><i /> Bitget UTA · reviewed sample</div>
      </header>}

      <main className="rulewake-shell" id="main-content">
        <section className="intro-band">
          <div>
            <p className="eyebrow">Collateral-rule impact simulator</p>
            <h1>Follow one rule change through the whole account.</h1>
          </div>
          <p>Verified Bitget terms enter at the boundary. Deterministic math shows what moves, what stays fixed, and where the account lands.</p>
        </section>

        <div className="causal-workspace">
          <aside className="control-rail" aria-label="Scenario controls">
            <section className="rail-section" aria-labelledby="event-title">
              <span className="rail-index">01 / RULE</span>
              <label className="fixture-select" htmlFor="reviewed-event">
                <span>Reviewed event</span>
                <select id="reviewed-event" name="eventId" autoComplete="off" value={eventId} onChange={(event) => selectEvent(event.target.value)}>
                  {sampleEvents.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
                </select>
              </label>
              <div className="rail-heading">
                <h2 id="event-title">{selectedEvent.title}</h2>
                <span className="reviewed">Reviewed fixture</span>
              </div>
              <div className="rule-ratio" aria-label={`Collateral ratio changes from ${beforeRate} to ${afterRate}`}>
                <div><span>Before</span><strong>{beforeRate}</strong></div>
                <i aria-hidden="true" />
                <div><span>After</span><strong>{afterRate}</strong></div>
              </div>
              <dl className="rail-facts">
                <div><dt>Asset</dt><dd>{selectedEvent.change.asset}</dd></div>
                <div><dt>Effective</dt><dd>{formatDate(selectedEvent.effectiveAt)}</dd></div>
              </dl>
              <a className="source-link" href={selectedEvent.sourceUrl} target="_blank" rel="noreferrer">Inspect primary source <span aria-hidden="true">↗</span></a>
            </section>

            <section className="rail-section" aria-labelledby="account-title">
              <span className="rail-index">02 / ACCOUNT</span>
              <label className="fixture-select" htmlFor="sample-account">
                <span>Sample account</span>
                <select id="sample-account" name="accountId" autoComplete="off" value={accountId} onChange={(event) => selectAccount(event.target.value)}>
                  {sampleAccounts.map((account) => <option key={account.id} value={account.id}>{account.label}</option>)}
                </select>
              </label>
              <div className="rail-heading">
                <h2 id="account-title">{selectedAccount.label}</h2>
                <span className={`sample-tag sample-tag--${selectedAccount.freshnessStatus}`}>{selectedAccount.freshnessLabel}</span>
              </div>
              <dl className="account-readout">
                <div><dt>Effective equity</dt><dd>{formatMoney(selectedAccount.effectiveEquityUsd)}</dd></div>
                <div><dt>Maintenance</dt><dd>{formatMoney(selectedAccount.maintenanceMarginUsd)}</dd></div>
                <div><dt>{selectedEvent.change.asset} gross</dt><dd>{formatMoney(grossUsd)}</dd></div>
                <div><dt>Margin ratio</dt><dd>{formatRatio(selectedAccount.marginRatio)}</dd></div>
              </dl>
              <button className="calculate" type="button" onClick={runCalculation} disabled={!canCalculate}>
                <span>Calculate impact</span><span aria-hidden="true">Run →</span>
              </button>
              <p className={`calculation-note ${!canCalculate ? "calculation-note--blocked" : ""}`}>
                {canCalculate
                  ? "Positions, orders, liabilities and fee residual stay pinned."
                  : "Stale snapshot cannot be calculated. Select a current account snapshot."}
              </p>
            </section>
          </aside>

          <div className="field-column">
            <CausalField
              asset={selectedEvent.change.asset}
              beforeRate={beforeRate}
              afterRate={afterRate}
              beforeRatio={formatRatio(selectedAccount.marginRatio)}
              projectedRatio={trace ? formatRatio(trace.result.projectedMarginRatio!) : null}
              projectedEquity={trace ? formatMoney(trace.result.projectedEffectiveEquityUsd) : null}
              buffer={buffer ? formatMoney(buffer) : null}
              riskBand={trace?.result.riskBand ?? null}
              effectiveAt={selectedEvent.effectiveAt}
              timeView={timeView}
              onTimeViewChange={setTimeView}
            />

            <section className={`impact-console ${trace ? "impact-console--ready" : ""}`} aria-live="polite" aria-busy={explanationLoading}>
              {!trace ? (
                <div className="console-empty">
                  <span>03 / IMPACT</span>
                  <strong>The field is holding the current account state.</strong>
                  <p>Run the calculation to release the verified rule through the account.</p>
                </div>
              ) : (
                <>
                  <div className="console-lead">
                    <div>
                      <span>03 / IMPACT · ENGINE v{trace.engineVersion}</span>
                      <h2>{riskHeadline(beforeBand, trace.result.riskBand)}</h2>
                    </div>
                    <div className="console-transition">
                      <div><small>Current</small><strong>{formatRatio(trace.baseline.suppliedMarginRatio)}</strong><StatusPill band={beforeBand} /></div>
                      <i aria-hidden="true" />
                      <div><small>Projected margin ratio</small><strong>{formatRatio(trace.result.projectedMarginRatio!)}</strong><StatusPill band={trace.result.riskBand} /></div>
                    </div>
                  </div>

                  <p className="plain-summary">
                    The updated {selectedEvent.change.asset} schedule {Number(trace.result.collateralDeltaUsd) < 0 ? "removes" : "adds"}{" "}
                    <strong>{formatMoney(trace.result.collateralDeltaUsd)}</strong> {Number(trace.result.collateralDeltaUsd) < 0 ? "from" : "to"} effective equity.
                    With maintenance requirements held constant, the account lands at {formatRatio(trace.result.projectedMarginRatio!)}.
                  </p>

                  <div className="console-tools">
                    <label className="target-control" htmlFor="target-ratio">
                      <span>Top-up target ratio</span>
                      <select id="target-ratio" name="targetRatio" autoComplete="off" value={targetRatio} onChange={(event) => {
                        setTargetRatio(event.target.value);
                        setExplanation(null);
                      }}>
                        <option value="0.65">65% · Watch ceiling</option>
                        <option value="0.75">75% · Default buffer</option>
                        <option value="0.8">80% · Warning ceiling</option>
                      </select>
                    </label>
                    <div className="buffer-readout"><span>Buffer to {formatTargetRatio(targetRatio)} target</span><strong>{formatMoney(buffer!)}</strong></div>
                    <button className="export-button" type="button" onClick={exportReport}>Export decision worksheet <span aria-hidden="true">↓</span></button>
                    <button className="qwen-button" type="button" onClick={requestExplanation} disabled={explanationLoading || !qwenEnabled}>
                      {!qwenEnabled ? "Qwen disabled in settings" : explanationLoading ? "Asking Qwen…" : explanation ? "Retry Qwen explanation" : "Explain with Qwen"}<span aria-hidden="true">✦</span>
                    </button>
                  </div>

                  <p className="qwen-disclosure">Only validated event facts and deterministic outputs are sent. No credentials or raw account payload.</p>
                  {explanationLoading && <p className="explanation-pending" role="status">Qwen is checking the grounded facts. The deterministic result remains available.</p>}
                  {explanation && (
                    <section className={`explanation explanation--${explanation.mode}`} aria-label="Impact explanation">
                      <div><span>{explanation.mode === "live_qwen" ? "Qwen · validated" : "Validated fallback"}</span><small>{explanation.mode === "live_qwen" ? "Numeric allowlist passed" : "Deterministic template"}</small></div>
                      <p>{explanation.text}</p>
                      {explanation.fallbackReason && <em>{explanation.fallbackReason}</em>}
                    </section>
                  )}

                  <button className="trace-toggle" type="button" onClick={() => setTraceOpen((open) => !open)} aria-expanded={traceOpen} aria-controls="calculation-trace">
                    <span>{traceOpen ? "Hide" : "Show"} calculation trace</span><span aria-hidden="true">{traceOpen ? "−" : "+"}</span>
                  </button>
                  {traceOpen && (
                    <div className="trace" id="calculation-trace">
                      <dl>
                        <div><dt>Old collateral contribution</dt><dd>{formatMoney(trace.changes[0]!.oldContributionUsd)}</dd></div>
                        <div><dt>New collateral contribution</dt><dd>{formatMoney(trace.changes[0]!.newContributionUsd)}</dd></div>
                        <div><dt>Normalized numerator</dt><dd>{formatMoney(trace.baseline.normalizedNumeratorUsd)}</dd></div>
                        <div><dt>Projected effective equity</dt><dd>{formatMoney(trace.result.projectedEffectiveEquityUsd)}</dd></div>
                      </dl>
                      <p>Assumptions: positions held constant · open orders held constant · liabilities held constant · fee residual held constant.</p>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>

        <footer className="rulewake-footer"><span>Decision support only · No trades are executed</span><span>Deterministic calculation · bounded Qwen explanation</span></footer>
      </main>
    </>
  );
}

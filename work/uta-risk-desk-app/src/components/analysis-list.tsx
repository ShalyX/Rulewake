"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearAnalysisHistory, readAnalysisHistory, type SavedAnalysis } from "../domain/analysis-history";

const ratio = (value: string) => `${(Number(value) * 100).toFixed(2)}%`;
const money = (value: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));

export function AnalysisList() {
  const [items, setItems] = useState<SavedAnalysis[] | null>(null);
  useEffect(() => setItems(readAnalysisHistory()), []);

  if (items === null) return <div className="empty-state"><p>Loading local analyses…</p></div>;
  if (items.length === 0) return (
    <div className="empty-state">
      <span>NO SAVED ANALYSES</span><h2>Your decision trail starts in the workspace.</h2>
      <p>Every completed calculation is saved locally in this browser. Credentials and raw account payloads are never included.</p>
      <Link className="primary-action" href="/app">Run a scenario <b>→</b></Link>
    </div>
  );

  return <>
    <div className="table-actions"><p>{items.length} local {items.length === 1 ? "analysis" : "analyses"}</p><button type="button" onClick={() => { clearAnalysisHistory(); setItems([]); }}>Clear local history</button></div>
    <div className="analysis-table" role="table" aria-label="Saved analyses">
      <div className="analysis-row analysis-row--head" role="row"><span>Run</span><span>Rule / account</span><span>Margin ratio</span><span>Collateral Δ</span><span>State</span></div>
      {items.map((item) => <article className="analysis-row" role="row" key={item.id}>
        <div><strong>{new Date(item.createdAt).toLocaleDateString()}</strong><small>{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>
        <div><strong>{item.eventTitle}</strong><small>{item.accountLabel} · {item.asset}</small></div>
        <div className="ratio-change"><span>{ratio(item.beforeRatio)}</span><i>→</i><strong>{ratio(item.projectedRatio)}</strong></div>
        <strong>{money(item.collateralDeltaUsd)}</strong>
        <span className={`status status--${item.riskBand}`}>{item.riskBand}</span>
      </article>)}
    </div>
  </>;
}

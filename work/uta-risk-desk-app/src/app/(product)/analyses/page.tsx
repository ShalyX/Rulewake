import type { Metadata } from "next";
import { AnalysisList } from "../../../components/analysis-list";

export const metadata: Metadata = { title: "Analyses" };

export default function AnalysesPage() {
  return <section className="product-page"><header className="page-heading"><div><p className="eyebrow">Decision record</p><h1>Saved analyses</h1></div><p>Review the calculations made in this browser. Each record preserves the rule, account fixture, engine version and resulting state.</p></header><AnalysisList /></section>;
}

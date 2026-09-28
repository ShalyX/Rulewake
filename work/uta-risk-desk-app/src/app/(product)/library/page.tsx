import type { Metadata } from "next";
import { sampleEvents } from "../../../data/sample-scenario";

export const metadata: Metadata = { title: "Rule library" };

const percent = (value: string) => `${(Number(value) * 100).toFixed(0)}%`;

export default function LibraryPage() {
  return <section className="product-page">
    <header className="page-heading"><div><p className="eyebrow">Source-bounded inputs</p><h1>Rule library</h1></div><p>Reviewed Bitget announcements converted into explicit parameter changes. Every scenario stays attached to its effective date and primary source.</p></header>
    <div className="library-summary"><div><strong>{sampleEvents.length}</strong><span>Reviewed changes</span></div><div><strong>100%</strong><span>Primary sources attached</span></div><div><strong>0</strong><span>Unsupported claims used</span></div></div>
    <div className="rule-list">
      {sampleEvents.map((event, index) => <article className="rule-card" key={event.id}>
        <div className="rule-card__index">{String(index + 1).padStart(2, "0")}</div>
        <div className="rule-card__main"><div className="rule-card__meta"><span>COLLATERAL RATIO</span><span>{event.change.asset}</span><span>Effective {new Date(event.effectiveAt).toLocaleDateString()}</span></div><h2>{event.title}</h2><p>{event.sourceTitle}</p><a href={event.sourceUrl} target="_blank" rel="noreferrer">Open primary source ↗</a></div>
        <div className="rule-card__change"><div><small>Before</small><strong>{percent(event.change.before[0]!.rate)}</strong></div><i /><div><small>After</small><strong>{percent(event.change.after[0]!.rate)}</strong></div></div>
        <div className="rule-card__proof"><span>REVIEWED FIXTURE</span><small>Source hash</small><code>{event.sourceHash.slice(0, 12)}…</code></div>
      </article>)}
    </div>
  </section>;
}

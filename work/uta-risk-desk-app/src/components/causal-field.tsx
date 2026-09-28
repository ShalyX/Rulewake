import type { CSSProperties } from "react";
import type { RiskBand } from "@risk-engine";

type CausalFieldProps = {
  asset: string;
  beforeRate: string;
  afterRate: string;
  beforeRatio: string;
  projectedRatio: string | null;
  projectedEquity: string | null;
  buffer: string | null;
  riskBand: RiskBand | null;
  effectiveAt: string;
  timeView: number;
  onTimeViewChange: (value: number) => void;
};

export function CausalField({
  asset,
  beforeRate,
  afterRate,
  beforeRatio,
  projectedRatio,
  projectedEquity,
  buffer,
  riskBand,
  effectiveAt,
  timeView,
  onTimeViewChange,
}: CausalFieldProps) {
  const projected = projectedRatio !== null;
  const after = projected && timeView >= 50;
  const effectiveLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(effectiveAt));

  return (
    <section
      className={`causal-field ${projected ? "causal-field--calculated" : ""} ${after ? "causal-field--after" : "causal-field--before"}`}
      aria-label="Causal impact field"
      role="region"
      style={{ "--time-position": `${timeView}%` } as CSSProperties}
    >
      <div className="field-sequence" aria-label="Rule impact sequence">
        <div><b>1</b><span>Rule change enters</span></div>
        <div><b>2</b><span>Effect propagates</span></div>
        <div><b>3</b><span>New equilibrium</span></div>
      </div>

      <div className="field-canvas" aria-hidden="true">
        <svg className="field-lines" viewBox="0 0 1000 520" preserveAspectRatio="none">
          <defs>
            <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#17202b" floodOpacity=".18" />
            </filter>
          </defs>
          <path className="contour contour--1" d="M0 420 C120 412 132 128 244 148 S340 400 455 355 S535 150 640 194 S730 420 828 314 S920 128 1000 162" />
          <path className="contour contour--2" d="M0 448 C130 438 152 192 252 202 S356 436 462 392 S548 214 646 244 S742 452 838 356 S930 184 1000 214" />
          <path className="contour contour--3" d="M0 478 C142 468 174 252 266 258 S374 470 478 430 S570 282 662 300 S766 482 858 402 S944 246 1000 274" />
          <path className="wake-line" d="M208 80 C270 110 282 176 330 214 S426 224 480 286 S572 360 638 314 S748 246 820 326 S910 396 1000 354" />
          <path className="wake-line wake-line--echo" d="M208 112 C280 138 292 208 342 242 S430 252 492 312 S580 384 648 340 S754 278 830 352 S918 420 1000 386" />
        </svg>
        <div className="rule-boundary"><i /><span>Verified rule</span><strong>{beforeRate} → {afterRate}</strong></div>
        <div className="field-node field-node--asset"><i /><span>{asset}</span><strong>Collateral contribution</strong></div>
        <div className="field-node field-node--equity"><i /><span>Effective equity</span><strong>{after ? projectedEquity : "Held at baseline"}</strong></div>
        <div className="field-node field-node--ratio"><i /><span>Margin ratio</span><strong>{after ? projectedRatio : beforeRatio}</strong></div>
        <div className="field-node field-node--buffer"><i /><span>Required buffer</span><strong>{after ? buffer : "Not yet applied"}</strong></div>
      </div>

      <div className="field-readout">
        <div className="field-readout__state">
          <span>{after ? "Projected" : "Current"}</span>
          <strong>{after ? projectedRatio : beforeRatio}</strong>
          <small>{after && riskBand ? `${riskBand} band` : "exchange baseline"}</small>
        </div>
        <div className="time-scrubber">
          <div><span>Before</span><b>Effective {effectiveLabel}</b><span>After</span></div>
          <label htmlFor="effective-time-view">Effective-time view</label>
          <input
            id="effective-time-view"
            type="range"
            min="0"
            max="100"
            step="100"
            value={timeView}
            disabled={!projected}
            onChange={(event) => onTimeViewChange(Number(event.target.value))}
          />
          <p>{after ? "After the rule takes effect" : "Before the rule takes effect"}</p>
        </div>
        <div className="field-readout__state field-readout__state--after">
          <span>Projected</span>
          <strong>{projectedRatio ?? "—"}</strong>
          <small>{projected ? "deterministic result" : "run calculation"}</small>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <nav className="landing-nav" aria-label="Primary navigation">
        <Link className="brand-lockup" href="/" aria-label="Rulewake home">
          <span className="rulewake-mark" aria-hidden="true"><i /><i /><i /></span>
          <strong>RULEWAKE</strong>
        </Link>
        <div className="landing-nav__links">
          <a href="#method">Method</a>
          <a href="#proof">Proof</a>
          <Link className="nav-cta" href="/app">Open risk desk <span aria-hidden="true">↗</span></Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Bitget UTA collateral intelligence</p>
          <h1>See the account move <em>before</em> the rule does.</h1>
          <p className="hero-deck">Rulewake traces a verified collateral-rule change through effective equity, margin ratio and required buffer—then lets Qwen explain only the validated result.</p>
          <div className="hero-actions">
            <Link className="primary-action" href="/app">Run a reviewed scenario <span>→</span></Link>
            <Link className="text-action" href="/library">Inspect the rule library</Link>
          </div>
          <dl className="hero-trust">
            <div><dt>Calculation</dt><dd>Deterministic</dd></div>
            <div><dt>Sources</dt><dd>Primary + dated</dd></div>
            <div><dt>Execution</dt><dd>Never automatic</dd></div>
          </dl>
        </div>

        <div className="hero-field" aria-label="Illustration of a collateral rule propagating through an account">
          <div className="hero-field__meta"><span>VERIFIED INPUT / rSTRC</span><strong>90 → 85%</strong></div>
          <div className="hero-boundary"><i /><span>effective time</span></div>
          <svg viewBox="0 0 900 520" aria-hidden="true">
            <path d="M-20 300 C120 260 150 110 285 190 S470 410 590 245 S790 160 930 235" />
            <path d="M-20 340 C120 310 170 180 295 240 S470 450 610 305 S800 230 930 280" />
            <path className="hero-wake" d="M145 120 C270 130 350 250 455 220 S610 355 735 310 S835 350 930 410" />
          </svg>
          <div className="hero-node hero-node--one"><b>1</b><span>Collateral value</span><strong>−$5,000</strong></div>
          <div className="hero-node hero-node--two"><b>2</b><span>Margin ratio</span><strong>100.00%</strong></div>
          <div className="hero-node hero-node--three"><b>3</b><span>Required buffer</span><strong>$28,333.34</strong></div>
          <div className="hero-result"><span>ACCOUNT STATE</span><strong>warning → critical</strong></div>
        </div>
      </section>

      <section className="method" id="method">
        <div className="section-heading"><p className="eyebrow">The method</p><h2>One rule. Its whole wake.</h2></div>
        <div className="method-grid">
          <article><span>01</span><h3>Verify the rule</h3><p>Start from a dated primary source, structured into explicit before-and-after parameters.</p></article>
          <article><span>02</span><h3>Calculate locally</h3><p>Run decimal-safe arithmetic against a pinned account snapshot with held-constant assumptions.</p></article>
          <article><span>03</span><h3>Explain the trace</h3><p>Qwen receives validated facts and outputs only. Numeric allowlisting keeps the model in lane.</p></article>
        </div>
      </section>

      <section className="proof-band" id="proof">
        <div><p className="eyebrow">Why it matters</p><h2>A parameter change is not a notification. It is a new account state.</h2></div>
        <div className="proof-stack">
          <p>Collateral contribution changes first.</p><p>Effective equity moves with it.</p><p>Margin ratio and buffer land somewhere new.</p>
        </div>
        <Link className="primary-action primary-action--light" href="/app">See the calculation <span>→</span></Link>
      </section>

      <footer className="landing-footer"><span>Rulewake · Decision support for Bitget UTA</span><span>Built for Bitget AI Base Camp Hackathon S2</span></footer>
    </main>
  );
}

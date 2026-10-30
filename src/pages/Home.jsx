import { Link } from "react-router-dom";
import FormatRace from "../components/format-race/FormatRace";
import FormatExplorer from "../components/FormatExplorer";
import ComputeArray from "../components/ComputeArray";
import GlyphHero from "../components/glyph-hero/GlyphHero";
import { scrollToSection } from "../smoothScroll";
import "./Home.css";

// Raise by stage, from the Atreides 2 nm readiness and budget plan (October 2026).
const RAISE_NOW = [
  {
    when: "DEC 2026", title: "Pre-seed", amount: "$30K", href: "https://pages.razorpay.com/pl_T8IamVwSHWOIHB/view",
    detail: "The first SF16 chip, on ChipFoundry's CI2612 shuttle. Tape-out 7 December 2026, parts back May 2027.",
    breakdown: [
      { amount: "$14,950", what: "ChipFoundry tape-out: fabrication, 100 packaged chips, 10 on M.2 cards, an evaluation board" },
      { amount: "≈ $15K", what: "Test boards and bring-up, import duties and taxes, shipping" },
    ],
    structure: "Raised as one amount. Paid to ChipFoundry in three steps: $500 to reserve, half the balance 60 days before the 7 December deadline, the rest 14 days before.",
  },
  { when: "IN PARALLEL", title: "Seed", amount: "$500K", href: "https://pages.razorpay.com/pl_TpMV9qTtS8x3pR/view", detail: "Batched SF prototypes, run alongside the initial prototype." },
];
const RAISE_LATER = [
  { when: "2027", title: "2 nm test chip", label: "ESTIMATE", amount: "$1.2M to $4.4M", detail: "A 10 mm² TSMC N2 shuttle chip with one 128 × 128 matrix unit in each format. Tape-out March 2027, bring-up by mid-year." },
  { when: "Q4 2027", title: "Production tape-out", label: "ESTIMATE", amount: "$23M to $59M", detail: "The 800 mm² die on its own N2 mask set, with HBM3E and I/O IP, design-service, test program and probe cards." },
  { when: "2028", title: "Year-1 production", label: "PLAN", amount: "$106M to $176M", detail: "1,000 N2 wafers, about 40,000 chips at $3,550 each, first parts mid-year. $142M at plan." },
];

export default function Home() {
  return (
    <div className="technical-home">
      <section className="sf-hero sf-container">
        <div className="hero-copy">
          <h1 data-reveal="1">Super <em>Intelligence.</em><span className="hero-sub">Done <em>Better</em></span></h1>
          <p className="hero-description" data-reveal="2">Superfloat is the infrastructure datatype for ultrafast intelligence at scale.</p>
        </div>
        <div className="hero-stage" data-reveal="3"><GlyphHero /></div>
      </section>
      <section id="technology" className="sf-section sf-container">
        <div className="section-label" data-reveal="">THE NUMBER FORMAT</div>
        <div className="section-heading" data-reveal="1"><h2>Precision is a<br /><em>design variable.</em></h2><p>Every stored bit has a cost. Superfloat lets you explore word widths from SF4 to SF16, making numerical representation part of the hardware design space.</p></div>
        <div data-reveal="2"><FormatExplorer /></div>
        <div className="format-notes" data-reveal="1"><p><span>READ THE WORD</span>BF16 separates sign, exponent, and fraction. The Superfloat view highlights the sign and scalable value field.</p><p><span>CHOOSE THE TRADEOFF</span>Fewer bits reduce raw storage per value. Model accuracy and realized speed depend on the workload and implementation.</p></div>
      </section>
      <section className="architecture-band" id="architecture">
        <div className="sf-container sf-section">
          <div className="section-label" data-reveal="">THE COMPUTE LAB</div>
          <div className="section-heading" data-reveal="1"><h2>2× faster<br /><em>at ½ the price.</em></h2><p>The same multiply-accumulate, without the exponent hardware. Watch an SF16 unit and a BF16 unit run side by side, then flip to the systolic arrays they build.</p></div>
          <div className="lab-array" data-reveal="2"><ComputeArray /></div>
          <div data-reveal="2"><FormatRace /></div>
        </div>
      </section>
      <section id="applications" className="sf-section sf-container">
        <div className="section-label" data-reveal="">THE DESIGN SPACE</div>
        <div className="section-heading" data-reveal="1"><h2>Big models.<br /><em>Finite resources.</em></h2><p>Edge inference lives inside constraints. A configurable datatype gives hardware designers another variable to investigate.</p></div>
        <div className="use-case-grid">
          <article data-reveal="1"><div className="case-glyph" aria-hidden="true">[ W ] → [ W′ ]</div><span className="section-label">MEMORY / REPRESENTATION</span><h3>Make every bit count.</h3><p>Explore smaller representations for weights and activations. Evaluate storage savings alongside the numerical behavior of your workload.</p><span className="case-tag">WEIGHTS · ACTIVATIONS · STORAGE</span></article>
          <article data-reveal="2"><div className="case-glyph" aria-hidden="true">Σ aᵢ · bᵢ</div><span className="section-label">COMPUTE / DATAFLOW</span><h3>Look inside the operation.</h3><p>Trace multiplication and accumulation, then inspect how repeated operations move through a processing-element array.</p><span className="case-tag">MAC · PIPELINING · SYSTOLIC ARRAYS</span></article>
          <article data-reveal="3"><div className="case-glyph" aria-hidden="true">sensor → ƒ(x)</div><span className="section-label">EDGE / DEPLOYMENT</span><h3>Design for the constraint.</h3><p>Investigate precision choices for robotics, wearables, and embedded sensing, where memory, latency, and energy budgets matter.</p><span className="case-tag">ROBOTICS · IOT · EMBEDDED AI</span></article>
        </div>
      </section>
      <section className="research-section sf-container">
        <div data-reveal="1"><div className="section-label">FIELD NOTES</div><h2>Under the hood.</h2><p>Ideas, architecture, and the details behind the datapath.</p></div>
        <Link to="/blogs/accelerated-hardware" className="research-link" data-reveal="2"><span className="section-label">ARCHITECTURE / IMPLEMENTATION NOTES</span><h3>Inside the Superfloat compute model <span>↗</span></h3><span>Read the model, math, and limitations</span></Link>
      </section>
      <section id="raise" className="sf-section sf-container raise-section">
        <div className="section-label" data-reveal="">THE RAISE</div>
        <div className="section-heading" data-reveal="1"><h2>From 130 nm to 2 nm,<br /><em>one stage at a time.</em></h2><p>Each stage puts the format in silicon that the next stage builds on. We raise for the stage in front of us.</p></div>
        <ol className="raise-now">
          {RAISE_NOW.map((stage, i) => (
            <li key={stage.title} className="raise-stage is-now" data-reveal={String(i + 1)}>
              <div className="raise-stage__top"><span className="raise-stage__when">{stage.when}</span><span className="raise-stage__badge">RAISING NOW</span></div>
              <h3>{stage.title}</h3>
              <span className="raise-stage__label">RAISING</span>
              <strong className="raise-stage__amount">{stage.amount}</strong>
              <p>{stage.detail}</p>
              {stage.breakdown && (
                <dl className="raise-breakdown">
                  {stage.breakdown.map((item) => <div key={item.amount}><dt>{item.amount}</dt><dd>{item.what}</dd></div>)}
                </dl>
              )}
              {stage.structure && <p className="raise-structure">{stage.structure}</p>}
              <div className="raise-stage__cta"><a className="sf-button primary" href={stage.href} target="_blank" rel="noopener noreferrer">Back the {stage.title.toLowerCase()} round <span>↗</span></a><span>CHECKOUT BY RAZORPAY</span></div>
            </li>
          ))}
        </ol>
        <div className="raise-gate" data-reveal="1">
          <Link to="/investors" className="raise-gate__icon" aria-label="Investors: the rounds after seed">
            <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><rect x="3" y="14" width="5" height="9" rx="1.5" /><rect x="10.5" y="9" width="5" height="14" rx="1.5" /><rect x="18" y="3" width="5" height="20" rx="1.5" /></svg>
          </Link>
          <Link to="/investors" className="raise-gate__label">INVESTORS · THE ROUNDS AHEAD <span>↗</span></Link>
        </div>
        <div className="raise-carousel" data-reveal="2">
          <ul className="raise-track">
            {[...RAISE_LATER, ...RAISE_LATER].map((stage, i) => (
              <li key={i} className="raise-stage is-later" aria-hidden={i >= RAISE_LATER.length || undefined}>
                <div className="raise-stage__top"><span className="raise-stage__when">{stage.when}</span></div>
                <h3>{stage.title}</h3>
                <span className="raise-stage__label">{stage.label}</span>
                <strong className="raise-stage__amount">{stage.amount}</strong>
                <p>{stage.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="sf-container closing-section" data-reveal="1"><span className="section-label">PRECISION IS ONLY THE BEGINNING.</span><h2>Get closer to<br /><em>the computation.</em></h2><div className="sf-actions"><a className="sf-button primary" href="#architecture" onClick={(event) => { event.preventDefault(); scrollToSection("architecture"); }}>Open the compute lab <span>↑</span></a></div><span className="closing-code" aria-hidden="true">01010011<br />01000110</span></section>
    </div>
  );
}

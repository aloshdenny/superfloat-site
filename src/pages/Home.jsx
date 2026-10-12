import { Link } from "react-router-dom";
import FormatRace from "../components/format-race/FormatRace";
import FormatExplorer from "../components/FormatExplorer";
import ComputeArray from "../components/ComputeArray";
import GlyphHero from "../components/glyph-hero/GlyphHero";
import { scrollToSection } from "../smoothScroll";
import "./Home.css";

export default function Home() {
  return (
    <div className="technical-home">
      <section className="sf-hero sf-container">
        <div className="hero-copy">
          <h1 data-reveal="1">Super <em>Intelligence.</em><span className="hero-sub">Done <em>Better</em></span></h1>
          <p className="hero-description" data-reveal="2">The infrastructure datatype for ultrafast intelligence at scale</p>
        </div>
        <div className="hero-stage" data-reveal="3"><GlyphHero /></div>
      </section>
      <section id="technology" className="sf-section sf-container">
        <div className="section-label" data-reveal="">01 / THE NUMBER FORMAT</div>
        <div className="section-heading" data-reveal="1"><h2>Precision is a<br /><em>design variable.</em></h2><p>Every stored bit has a cost. Superfloat lets you explore word widths from SF4 to SF16, making numerical representation part of the hardware design space.</p></div>
        <div data-reveal="2"><FormatExplorer /></div>
        <div className="format-notes" data-reveal="1"><p><span>READ THE WORD</span>BF16 separates sign, exponent, and fraction. The Superfloat view highlights the sign and scalable value field.</p><p><span>CHOOSE THE TRADEOFF</span>Fewer bits reduce raw storage per value. Model accuracy and realized speed depend on the workload and implementation.</p></div>
      </section>
      <section className="architecture-band" id="architecture">
        <div className="sf-container sf-section">
          <div className="section-label" data-reveal="">02 / THE COMPUTE LAB</div>
          <div className="section-heading" data-reveal="1"><h2>2× faster<br /><em>at ½ the price.</em></h2><p>The same multiply-accumulate, without the exponent hardware. Watch an SF16 unit and a BF16 unit run side by side, then flip to the systolic arrays they build.</p></div>
          <div className="lab-array" data-reveal="2"><ComputeArray /></div>
          <div data-reveal="2"><FormatRace /></div>
        </div>
      </section>
      <section id="applications" className="sf-section sf-container">
        <div className="section-label" data-reveal="">03 / THE DESIGN SPACE</div>
        <div className="section-heading" data-reveal="1"><h2>Big models.<br /><em>Finite resources.</em></h2><p>Edge inference lives inside constraints. A configurable datatype gives hardware designers another variable to investigate.</p></div>
        <div className="use-case-grid">
          <article data-reveal="1"><div className="case-glyph" aria-hidden="true">[ W ] → [ W′ ]</div><span className="section-label">MEMORY / REPRESENTATION</span><h3>Make every bit count.</h3><p>Explore smaller representations for weights and activations. Evaluate storage savings alongside the numerical behavior of your workload.</p><span className="case-tag">WEIGHTS · ACTIVATIONS · STORAGE</span></article>
          <article data-reveal="2"><div className="case-glyph" aria-hidden="true">Σ aᵢ · bᵢ</div><span className="section-label">COMPUTE / DATAFLOW</span><h3>Look inside the operation.</h3><p>Trace multiplication and accumulation, then inspect how repeated operations move through a processing-element array.</p><span className="case-tag">MAC · PIPELINING · SYSTOLIC ARRAYS</span></article>
          <article data-reveal="3"><div className="case-glyph" aria-hidden="true">sensor → ƒ(x)</div><span className="section-label">EDGE / DEPLOYMENT</span><h3>Design for the constraint.</h3><p>Investigate precision choices for robotics, wearables, and embedded sensing—where memory, latency, and energy budgets matter.</p><span className="case-tag">ROBOTICS · IOT · EMBEDDED AI</span></article>
        </div>
      </section>
      <section className="research-section sf-container">
        <div data-reveal="1"><div className="section-label">04 / FIELD NOTES</div><h2>Under the hood.</h2><p>Ideas, architecture, and the details behind the datapath.</p></div>
        <Link to="/blogs/accelerated-hardware" className="research-link" data-reveal="2"><span className="section-label">ARCHITECTURE / IMPLEMENTATION NOTES</span><h3>Inside the Superfloat compute model <span>↗</span></h3><span>Read the model, math, and limitations</span></Link>
      </section>
      <section className="sf-container closing-section" data-reveal="1"><span className="section-label">PRECISION IS ONLY THE BEGINNING.</span><h2>Get closer to<br /><em>the computation.</em></h2><div className="sf-actions"><a className="sf-button primary" href="#architecture" onClick={(event) => { event.preventDefault(); scrollToSection("architecture"); }}>Open the compute lab <span>↑</span></a></div><span className="closing-code" aria-hidden="true">01010011<br />01000110</span></section>
    </div>
  );
}

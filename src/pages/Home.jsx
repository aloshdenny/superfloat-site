import { Link } from "react-router-dom";
import FMAPipeline from "../components/FMAPipeline";
import FormatExplorer from "../components/FormatExplorer";
import ComputeArray from "../components/ComputeArray";
import "./Home.css";

const repository = "https://github.com/aloshdenny/superfloat-site";

export default function Home() {
  return (
    <div className="technical-home">
      <section className="sf-hero sf-container">
        <div className="hero-copy">
          <div className="kicker"><span className="signal-dot" /> NUMBER FORMATS × AI HARDWARE</div>
          <h1>Intelligence.<br />At the <em>bit level.</em></h1>
          <p className="hero-description">A configurable number format for AI at the edge. Explore the space between numerical precision, memory footprint, and the hardware that runs inference.</p>
          <div className="sf-actions"><a className="sf-button primary" href="#architecture">Enter the compute lab <span>↗</span></a><a className="sf-text-link" href={repository} target="_blank" rel="noreferrer">Explore source <span>↗</span></a></div>
          <div className="hero-footnote"><span>SF4 → SF16</span> CONFIGURABLE PRECISION. VISIBLE COMPUTATION.</div>
        </div>
        <ComputeArray />
      </section>
      <div className="spec-strip sf-container" aria-label="Architecture at a glance">
        <div><span className="spec-label">01 / REPRESENTATION</span><strong>4–16 <small>bits</small></strong><span>Scalable word width</span></div>
        <div><span className="spec-label">02 / SF16 LAYOUT</span><strong>1 + 15</strong><span>Sign + value field</span></div>
        <div><span className="spec-label">03 / COMPUTE PRIMITIVE</span><strong>a × b + c</strong><span>Multiply. Accumulate. Repeat.</span></div>
        <div className="spec-note"><span className="signal-dot" /><p>From a single bit<br />to a matrix operation.</p></div>
      </div>
      <section id="technology" className="sf-section sf-container">
        <div className="section-label">01 / THE NUMBER FORMAT</div>
        <div className="section-heading"><h2>Precision is a<br /><em>design variable.</em></h2><p>Every stored bit has a cost. Superfloat lets you explore word widths from SF4 to SF16, making numerical representation part of the hardware design space.</p></div>
        <FormatExplorer />
        <div className="format-notes"><p><span>READ THE WORD</span>BF16 separates sign, exponent, and fraction. The Superfloat view highlights the sign and scalable value field.</p><p><span>CHOOSE THE TRADEOFF</span>Fewer bits reduce raw storage per value. Model accuracy and realized speed depend on the workload and implementation.</p></div>
      </section>
      <section className="architecture-band" id="architecture">
        <div className="sf-container sf-section">
          <div className="section-label">02 / THE COMPUTE LAB</div>
          <div className="section-heading"><h2>Follow the signal.<br /><em>Inspect the arithmetic.</em></h2><p>Step inside the multiply-accumulate datapath, then switch to a systolic array. Change the clock, workload, and array size to see how the model responds.</p></div>
          <div className="pipeline-strip" aria-label="Compute sequence"><span><b>01</b> Operand registers</span><i>→</i><span><b>02</b> Multiply pipeline</span><i>→</i><span><b>03</b> Accumulate</span><i>→</i><span><b>04</b> Write back</span></div>
          <FMAPipeline initiallyExpanded initialFrequency={8} autoPlay={false} />
          <p className="model-note"><span>MODEL NOTE</span> This is an architectural visualization. Throughput is calculated from the demo’s cycle assumptions and selected clock; it is not a measured device benchmark. Animation time is slowed for inspection.</p>
        </div>
      </section>
      <section id="applications" className="sf-section sf-container">
        <div className="section-label">03 / THE DESIGN SPACE</div>
        <div className="section-heading"><h2>Big models.<br /><em>Finite resources.</em></h2><p>Edge inference lives inside constraints. A configurable datatype gives hardware designers another variable to investigate.</p></div>
        <div className="use-case-grid">
          <article><div className="case-glyph" aria-hidden="true">[ W ] → [ W′ ]</div><span className="section-label">MEMORY / REPRESENTATION</span><h3>Make every bit count.</h3><p>Explore smaller representations for weights and activations. Evaluate storage savings alongside the numerical behavior of your workload.</p><span className="case-tag">WEIGHTS · ACTIVATIONS · STORAGE</span></article>
          <article><div className="case-glyph" aria-hidden="true">Σ aᵢ · bᵢ</div><span className="section-label">COMPUTE / DATAFLOW</span><h3>Look inside the operation.</h3><p>Trace multiplication and accumulation, then inspect how repeated operations move through a processing-element array.</p><span className="case-tag">MAC · PIPELINING · SYSTOLIC ARRAYS</span></article>
          <article><div className="case-glyph" aria-hidden="true">sensor → ƒ(x)</div><span className="section-label">EDGE / DEPLOYMENT</span><h3>Design for the constraint.</h3><p>Investigate precision choices for robotics, wearables, and embedded sensing—where memory, latency, and energy budgets matter.</p><span className="case-tag">ROBOTICS · IOT · EMBEDDED AI</span></article>
        </div>
      </section>
      <section className="research-section sf-container">
        <div><div className="section-label">04 / FIELD NOTES</div><h2>Under the hood.</h2><p>Ideas, architecture, and the details behind the datapath.</p></div>
        <Link to="/blogs/accelerated-hardware" className="research-link"><span className="section-label">ARCHITECTURE / IMPLEMENTATION NOTES</span><h3>Inside the Superfloat compute model <span>↗</span></h3><span>Read the model, math, and limitations</span></Link>
      </section>
      <section className="sf-container closing-section"><span className="section-label">PRECISION IS ONLY THE BEGINNING.</span><h2>Get closer to<br /><em>the computation.</em></h2><div className="sf-actions"><a className="sf-button primary" href="#architecture">Open the compute lab <span>↑</span></a><a className="sf-text-link" href={repository} target="_blank" rel="noreferrer">View on GitHub ↗</a></div><span className="closing-code" aria-hidden="true">01010011<br />01000110</span></section>
    </div>
  );
}

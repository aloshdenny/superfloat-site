import { useEffect, useRef, useState } from "react";

const probes = [[0, 0], [3, 7], [8, 8], [15, 15]];

export default function ComputeArray() {
  const surface = useRef(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [probe, setProbe] = useState(1);
  const [row, col] = probes[probe];
  const sampleA = 0.1 * (row % 5 + 1);
  const sampleB = 0.05 * (col % 4 + 1);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(surface.current);
    const onVisibility = () => {
      const bounds = surface.current.getBoundingClientRect();
      setVisible(!document.hidden && bounds.bottom > 0 && bounds.top < window.innerHeight);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { media.removeEventListener("change", sync); observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  return (
    <div ref={surface} className={`compute-visual signal-array ${paused || !visible || reduced ? "motion-paused" : ""}`} aria-label="Illustrative 16 by 16 processing-element array">
      <div className="visual-top"><span><i className="signal-dot" /> SIGNAL FLOW / SF16</span><button className="array-pause" onClick={() => setPaused(!paused)} disabled={reduced} aria-label={paused ? "Resume array animation" : "Pause array animation"}>{reduced ? "REDUCED MOTION" : paused ? "▶ RESUME" : "Ⅱ PAUSE"}</button></div>
      <div className="chip-scene">
        <div className="chip-input input-a">OPERAND A <span>↓ ↓ ↓ ↓ ↓ ↓</span></div>
        <div className="chip-input input-b">OPERAND B <span>→ → →</span></div>
        <div className="chip-grid" aria-hidden="true">
          {Array.from({ length: 256 }, (_, i) => {
            const r = Math.floor(i / 16), c = i % 16;
            return <span key={i} style={{ "--phase": `${(r + c) * 85 - 4000}ms` }} className={`signal-cell ${r === row || c === col ? "probe-trace" : ""} ${r === row && c === col ? "probe-cell" : ""}`} />;
          })}
        </div>
        <div className="chip-output">C[{row}, {col}] ← C[{row}, {col}] + A[{row}, k] · B[k, {col}]</div>
      </div>
      <div className="array-inspector">
        <div className="probe-heading"><span>PROBE A PROCESSING ELEMENT</span><span>16 × 16</span></div>
        <div className="probe-buttons" aria-label="Processing element probe">{probes.map(([r, c], i) => <button key={i} aria-pressed={probe === i} onClick={() => setProbe(i)}>PE[{r},{c}]</button>)}</div>
        <div className="probe-operands" aria-label="Illustrative first accumulation, starting from zero"><span><small>A[{row},0]</small>{sampleA.toFixed(2)}</span><b>×</b><span><small>B[0,{col}]</small>{sampleB.toFixed(2)}</span><b>→</b><span><small>C[{row},{col}]</small>{(sampleA * sampleB).toFixed(3)}</span></div>
        <span className="probe-example-label">SAMPLE VALUES · k = 0 · INITIAL ACCUMULATOR = 0</span>
        <p>Operands meet at the highlighted cell; its accumulator updates one output in C. The moving diagonal illustrates staggered data arrival.</p>
      </div>
      <div className="visual-bottom"><span><i className="signal-dot" /> DATAFLOW SCHEMATIC</span><span>NOT A TIMING TRACE</span></div>
    </div>
  );
}

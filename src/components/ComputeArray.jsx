import { useEffect, useRef, useState } from "react";

const N = 16;
const HOP_MS = 70; // time for an operand to move one PE along the trace

export default function ComputeArray() {
  const surface = useRef(null);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [[row, col], setProbe] = useState([3, 7]);

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

  const probeAt = (event) => {
    const { r, c } = event.target.dataset;
    if (r === undefined) return;
    const next = [Number(r), Number(c)];
    setProbe((prev) => (prev[0] === next[0] && prev[1] === next[1] ? prev : next));
  };
  const moveProbe = (event) => {
    const move = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key];
    if (!move) return;
    event.preventDefault();
    const clamp = (v) => Math.min(N - 1, Math.max(0, v));
    setProbe(([r, c]) => [clamp(r + move[0]), clamp(c + move[1])]);
  };

  return (
    <div ref={surface} className={`compute-visual signal-array ${!visible || reduced ? "motion-paused" : ""}`} aria-label="Illustrative 16 by 16 processing-element array">
      <div className="chip-scene">
        <div className="chip-input input-top">OPERAND B <span>↓ ↓ ↓ ↓ ↓ ↓</span></div>
        <div className="chip-input input-left">OPERAND A <span>→ → →</span></div>
        <div className="chip-grid" tabIndex={0} role="group" aria-label={`Processing elements. Tracing PE[${row}, ${col}]; arrow keys move the trace.`} onPointerOver={probeAt} onPointerDown={probeAt} onKeyDown={moveProbe}>
          {Array.from({ length: N * N }, (_, i) => {
            const r = Math.floor(i / N), c = i % N;
            // A[row, k] hops in from the left along the row, B[k, col] down from the top along the column,
            // and both arrive at PE[row, col]. Trace cells remount when the probe moves so their timing restarts together.
            let trace = "";
            let hops = 0;
            if (r === row && c === col) { trace = "probe-cell"; hops = Math.max(row, col) + 1; }
            else if (r === row && c < col) { trace = "trace-a"; hops = c; }
            else if (c === col && r < row) { trace = "trace-b"; hops = r; }
            else if (r === row || c === col) trace = "probe-trace";
            return <span key={trace ? `${i}-${row}-${col}` : i} data-r={r} data-c={c} style={{ "--phase": `${(r + c) * 85 - 4000}ms`, "--hop": `${hops * HOP_MS}ms` }} className={`signal-cell ${trace}`} />;
          })}
        </div>
        <div className="chip-output">C[{row}, {col}] ← C[{row}, {col}] + A[{row}, k] · B[k, {col}]</div>
      </div>
    </div>
  );
}

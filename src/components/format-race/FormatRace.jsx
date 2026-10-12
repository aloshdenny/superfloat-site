import { useEffect, useId, useRef, useState } from "react";
import { ARRAY_K, ARRAY_N, UNITS, arrayCycles, arrayNs, macLatencyNs, mhz, peAt, stageAt } from "./raceModel";
import { BAND_H, DIAGRAMS, DIAGRAM_H, DIAGRAM_W, bandTop, nodeSize, nodeY } from "./fmaDiagrams";
import "./FormatRace.css";

const LANES = [UNITS.sf16, UNITS.bf16];
// Real time per simulated nanosecond on each face, so one race lasts a few seconds.
const FACES = {
  fma: { msPerNs: 50, endNs: Math.max(...LANES.map(macLatencyNs)) },
  array: { msPerNs: 8, endNs: Math.max(...LANES.map((u) => arrayNs(u))) },
};
const HOLD_MS = 2400;
const ratio = (a, b) => (b / a).toFixed(1);

// Simulated time in ns: runs the race, holds the finish, and starts over while `running`.
function useRaceClock(face, running, reduced) {
  const { msPerNs, endNs } = FACES[face];
  const [t, setT] = useState(reduced ? endNs : 0);
  useEffect(() => {
    if (reduced) { setT(endNs); return undefined; }
    setT(0);
    if (!running) return undefined;
    let start = null;
    let frame = 0;
    const tick = (now) => {
      if (start === null) start = now;
      let elapsed = now - start;
      if (elapsed > endNs * msPerNs + HOLD_MS) { start = now; elapsed = 0; }
      setT(Math.min(elapsed / msPerNs, endNs));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [face, running, reduced, msPerNs, endNs]);
  return t;
}

function ArrayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={1 + c * 6.5} y={1 + r * 6.5} width="5" height="5" rx="1.6" />))}
    </svg>
  );
}

function FmaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="1" y="1" width="18" height="18" rx="5" fill="none" />
      <path d="M6 6l4 4M10 6l-4 4M12.5 13h4M14.5 11v4" fill="none" />
    </svg>
  );
}

// One pipeline drawn as a datapath, top to bottom, a band per stage. The band, nodes and wires of the
// stage the operation is in light up; earlier ones stay faintly lit.
function FmaLane({ unit, t, axisNs }) {
  const markerId = `fd-arrow-${useId().replace(/[^\w-]/g, "")}`;
  const total = macLatencyNs(unit);
  const stage = stageAt(unit, t);
  const diagram = DIAGRAMS[unit.name];
  const n = diagram.bands.length;
  const byId = Object.fromEntries(diagram.nodes.map((node) => [node.id, { ...node, y: nodeY(node.band, n), ...nodeSize(node) }]));
  const state = (band) => (band < stage ? "is-past" : band === stage ? "is-active" : "");
  // Feedback from the accumulator: over the top when both ends share a stage, else up the right margin.
  const loop = diagram.loop && (() => {
    const from = byId[diagram.loop.from];
    const to = byId[diagram.loop.to];
    if (from.band === to.band) {
      const top = from.y - from.hh - 12;
      return { d: `M${from.x} ${from.y - from.hh}V${top}H${to.x + 12}V${to.y - to.hh - 2}`, labelX: (from.x + to.x) / 2 + 6, labelY: top - 5, anchor: "middle" };
    }
    const xr = DIAGRAM_W - 10;
    return { d: `M${from.x} ${from.y - from.hh}V${from.y - from.hh - 10}H${xr}V${to.y}H${to.x + to.hw + 4}`, labelX: xr - 6, labelY: (from.y + to.y) / 2, anchor: "end" };
  })();
  return (
    <div className={`lane lane--${unit.name.toLowerCase()}`}>
      <div className="lane__head"><span className="lane__name">{unit.name}</span><span>{unit.format} · {mhz(unit).toFixed(1)} MHz · {n} stages</span></div>
      <svg className="fd" viewBox={`0 0 ${DIAGRAM_W} ${DIAGRAM_H}`} role="img" aria-label={`${unit.name} multiply-accumulate datapath, ${n} pipeline stages`}>
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>
        {diagram.bands.map((band, i) => (
          <g key={band.name} className={`fd-band ${state(i)} ${band.exponent ? "is-exponent" : ""}`}>
            <rect x="6" y={bandTop(i)} width={DIAGRAM_W - 12} height={BAND_H - 8} rx="14" />
            <text x="20" y={bandTop(i) + 17}>{`${i + 1} · ${band.name.toUpperCase()}`}</text>
            {band.exponent && <text className="fd-tag" x={DIAGRAM_W - 20} y={bandTop(i) + 17} textAnchor="end">EXPONENT</text>}
          </g>
        ))}
        {diagram.edges.map(([fromId, toId]) => {
          const a = byId[fromId];
          const b = byId[toId];
          const sameRow = a.band === b.band;
          const d = sameRow
            ? `M${a.x + a.hw} ${a.y}H${b.x - b.hw - 3}`
            : (() => { const y1 = a.y + a.hh; const y2 = b.y - b.hh - 3; const ym = (y1 + y2) / 2; return `M${a.x} ${y1}V${ym}H${b.x}V${y2}`; })();
          return <path key={`${fromId}-${toId}`} className={`fd-wire ${state(b.band)}`} d={d} markerEnd={`url(#${markerId})`} />;
        })}
        {loop && (
          <g className={`fd-loop ${stage >= byId[diagram.loop.to].band ? "is-past" : ""}`}>
            <path className="fd-wire" d={loop.d} markerEnd={`url(#${markerId})`} />
            <text x={loop.labelX} y={loop.labelY} textAnchor={loop.anchor}>{diagram.loop.label}</text>
          </g>
        )}
        {diagram.nodes.map((node) => {
          const { x, y, hw, hh } = byId[node.id];
          return (
            <g key={node.id} className={`fd-node fd-node--${node.kind} ${state(node.band)} ${node.exponent ? "is-exponent" : ""}`}>
              {node.kind === "op" ? <circle cx={x} cy={y} r={hw} /> : <rect x={x - hw} y={y - hh} width={hw * 2} height={hh * 2} rx={node.kind === "io" ? hh : 9} />}
              <text x={x} y={node.kind === "reg" && node.sub ? y - 4 : y}>{node.label}</text>
              {node.sub && <text className="fd-sub" x={x} y={node.kind === "op" ? y + hh + 11 : y + 9}>{node.sub}</text>}
            </g>
          );
        })}
      </svg>
      <div className="lane__clock"><span>{Math.min(t, total).toFixed(1)} ns</span><span>{t >= total ? "DONE" : `STAGE ${stage + 1} / ${n}`}</span></div>
      <div className="lane__bar"><i style={{ transform: `scaleX(${Math.min(t, total) / axisNs})` }} /></div>
    </div>
  );
}

function ArrayLane({ unit, t, axisNs }) {
  const total = arrayNs(unit);
  const cycles = arrayCycles(unit);
  return (
    <div className={`lane lane--${unit.name.toLowerCase()}`}>
      <div className="lane__head"><span className="lane__name">{unit.name}</span><span>{ARRAY_N} × {ARRAY_N} PEs · new term every {unit.loop === 1 ? "cycle" : `${unit.loop} cycles`}</span></div>
      <div className="lane__grid" aria-hidden="true">
        {Array.from({ length: ARRAY_N * ARRAY_N }, (_, i) => {
          const { terms, arriving, done } = peAt(unit, Math.floor(i / ARRAY_N), i % ARRAY_N, t);
          return <i key={i} className={done ? "is-done" : arriving ? "is-arriving" : ""} style={{ "--level": terms / ARRAY_K }} />;
        })}
      </div>
      <div className="lane__clock"><span>{Math.min(t, total).toFixed(0)} ns</span><span>{t >= total ? "DONE" : `CYCLE ${Math.floor(t / unit.periodNs)} / ${cycles}`}</span></div>
      <div className="lane__bar"><i style={{ transform: `scaleX(${Math.min(t, total) / axisNs})` }} /></div>
    </div>
  );
}

function Stat({ value, label, detail }) {
  return <div className="race__stat"><strong>{value}</strong><span>{label}</span><small>{detail}</small></div>;
}

export default function FormatRace() {
  const card = useRef(null);
  const [flipped, setFlipped] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);
  const face = flipped ? "array" : "fma";
  const t = useRaceClock(face, inView, reduced);
  const [sf, bf] = LANES;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduced(media.matches);
    syncMotion();
    media.addEventListener("change", syncMotion);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && !document.hidden), { threshold: 0.2 });
    observer.observe(card.current);
    const onVisibility = () => { if (document.hidden) setInView(false); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { media.removeEventListener("change", syncMotion); observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  const fmaT = face === "fma" ? t : FACES.fma.endNs;
  const arrayT = face === "array" ? t : FACES.array.endNs;

  return (
    <div ref={card} className={`race ${flipped ? "is-flipped" : ""}`}>
      <div className="race__inner">
        <section className="race__face race__front" aria-hidden={flipped} inert={flipped}>
          <header className="race__head">
            <div><span className="race__label">ONE MULTIPLY-ACCUMULATE · SF16 VS BF16</span><h3>Same operation. No exponent hardware.</h3></div>
            <button type="button" className="flip-button" onClick={() => setFlipped(true)} aria-label="Flip to the systolic arrays"><ArrayIcon />SYSTOLIC ARRAYS</button>
          </header>
          <div className="race__lanes">{LANES.map((u) => <FmaLane key={u.name} unit={u} t={fmaT} axisNs={FACES.fma.endNs} />)}</div>
          <div className="race__stats">
            <Stat value={`${ratio(macLatencyNs(sf), macLatencyNs(bf))}×`} label="faster per MAC" detail={`${macLatencyNs(sf).toFixed(1)} vs ${macLatencyNs(bf).toFixed(1)} ns`} />
            <Stat value="−34%" label="PE power" detail="0.78 vs 1.18 mW" />
            <Stat value="−43%" label="energy per token" detail="GPT-2 small, 5.55 vs 9.74 J" />
          </div>
          <p className="race__note">Pipelines from the Atreides RTL. Each PE was hardened in the same SKY130 flow at a 20 ns target, worst corner; the clock shown is what its slack leaves. Energy per token is the signed-off chips running GPT-2 small. Animation slowed about 50 million times.</p>
        </section>
        <section className="race__face race__back" aria-hidden={!flipped} inert={!flipped}>
          <header className="race__head">
            <div><span className="race__label">{ARRAY_N} × {ARRAY_N} SYSTOLIC ARRAY · {ARRAY_N} × {ARRAY_N} × {ARRAY_K} MATMUL</span><h3>SF16 closes each sum in one cycle.</h3></div>
            <button type="button" className="flip-button" onClick={() => setFlipped(false)} aria-label="Flip back to the FMA units"><FmaIcon />FMA UNITS</button>
          </header>
          <div className="race__lanes">{LANES.map((u) => <ArrayLane key={u.name} unit={u} t={arrayT} axisNs={FACES.array.endNs} />)}</div>
          <div className="race__stats">
            <Stat value={`${ratio(arrayNs(sf), arrayNs(bf))}×`} label="faster matmul" detail={`${arrayNs(sf).toFixed(0)} vs ${arrayNs(bf).toFixed(0)} ns`} />
            <Stat value={`${sf.loop} vs ${bf.loop}`} label="cycles per accumulate" detail="the loop each PE closes" />
            <Stat value="−14%" label="tile area" detail="1.40 vs 1.63 mm²" />
          </div>
          <p className="race__note">Inputs enter skewed by one cycle per row and column and are fed at full rate. BF16&apos;s accumulate loop spans three cycles, so each PE takes a new term every third cycle. On the v1 chip the 16-bit pin bus limits both formats before this does.</p>
        </section>
      </div>
    </div>
  );
}

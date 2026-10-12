import { useEffect, useRef, useState } from "react";
import { ARRAY_K, ARRAY_N, UNITS, arrayCycles, arrayNs, macLatencyNs, mhz, peAt, stageAt } from "./raceModel";
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

function FmaLane({ unit, t, axisNs }) {
  const total = macLatencyNs(unit);
  const stage = stageAt(unit, t);
  const inCycle = (t % unit.periodNs) / unit.periodNs;
  return (
    <div className={`lane lane--${unit.name.toLowerCase()}`}>
      <div className="lane__head"><span className="lane__name">{unit.name}</span><span>{unit.format} · {mhz(unit).toFixed(1)} MHz · {unit.stages.length} stages</span></div>
      <ol className="lane__stages">
        {unit.stages.map((s, i) => {
          const lit = i < stage ? 4 : i === stage ? Math.ceil(inCycle * 4) : 0;
          return (
            <li key={s.name} className={`stage ${i === stage ? "is-active" : ""} ${i < stage ? "is-past" : ""} ${s.exponent ? "is-exponent" : ""}`}>
              <span className="stage__cells" aria-hidden="true">{[0, 1, 2, 3].map((n) => <i key={n} className={n < lit ? "on" : ""} />)}</span>
              <span className="stage__text"><b>{s.name}</b><small>{s.detail}</small></span>
              {s.exponent && <span className="stage__tag">EXPONENT</span>}
            </li>
          );
        })}
      </ol>
      <div className="lane__clock"><span>{Math.min(t, total).toFixed(1)} ns</span><span>{t >= total ? "DONE" : `STAGE ${stage + 1} / ${unit.stages.length}`}</span></div>
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

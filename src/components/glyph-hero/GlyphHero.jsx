import { useEffect, useRef, useState } from "react";

// Same order as buildSubjects() in subjects.js. Kept here so the page doesn't load three.js to label the tabs.
const SUBJECTS = [
  { label: "SF", caption: "THE FORMAT / SF4 → SF16", description: "the Superfloat mark" },
  { label: "CHIP", caption: "ATREIDES / 4 TILES · 256 MACS", description: "the Atreides chip package" },
  { label: "ARRAY", caption: "16 × 16 PROCESSING ELEMENTS", description: "a 16 by 16 systolic array" },
];
const CYCLE_SECONDS = 8.5; // HOLD + TRANSITION in engine.js

export default function GlyphHero() {
  const stage = useRef(null);
  const canvas = useRef(null);
  const engine = useRef(null);
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [status, setStatus] = useState("loading");
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let disposed = false;
    const cleanups = [];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isDark = () => document.documentElement.classList.contains("dark");
    setReduced(motion.matches);

    import("./engine.js")
      .then(({ createGlyphHero }) => {
        if (disposed) return;
        const hero = createGlyphHero(canvas.current, {
          dark: isDark(),
          reducedMotion: motion.matches,
          onSubject: (index) => {
            setActive(index);
            setCycle((n) => n + 1);
          },
        });
        engine.current = hero;
        setStatus("ready");

        let inView = false;
        const sync = () => {
          const run = inView && !document.hidden && !motion.matches;
          if (run) hero.start();
          else hero.stop();
          setPlaying(run);
        };
        const resize = new ResizeObserver(([entry]) => hero.resize(entry.contentRect.width, entry.contentRect.height));
        resize.observe(stage.current);
        const view = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { threshold: 0.05 });
        view.observe(stage.current);
        const onMotion = () => {
          setReduced(motion.matches);
          hero.setReducedMotion(motion.matches);
          sync();
        };
        const onTheme = () => hero.setTheme(isDark());
        motion.addEventListener("change", onMotion);
        document.addEventListener("visibilitychange", sync);
        window.addEventListener("themechange", onTheme);
        cleanups.push(() => {
          resize.disconnect();
          view.disconnect();
          motion.removeEventListener("change", onMotion);
          document.removeEventListener("visibilitychange", sync);
          window.removeEventListener("themechange", onTheme);
          hero.dispose();
        });
      })
      .catch(() => {
        if (!disposed) setStatus("failed");
      });

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
      engine.current = null;
    };
  }, []);

  return (
    <div className={`glyph-hero ${playing ? "" : "is-paused"}`}>
      <div ref={stage} className="glyph-stage" role="img" aria-label={`Animated glyph rendering of ${SUBJECTS[active].description}`}>
        <canvas ref={canvas} className={`glyph-canvas ${status === "ready" ? "is-ready" : ""}`} aria-hidden="true" />
        {status === "failed" && <p className="glyph-fallback">sƒ · 0101 · 16 × 16</p>}
      </div>
      <div className="glyph-controls" role="group" aria-label="Choose what the animation shows">
        {SUBJECTS.map((s, i) => (
          <button key={s.label} type="button" aria-pressed={active === i} disabled={status !== "ready"} onClick={() => engine.current?.setSubject(i)}>
            <span>{String(i + 1).padStart(2, "0")}</span>{s.label}
            {active === i && !reduced && status === "ready" && <i key={cycle} className="glyph-progress" style={{ animationDuration: `${CYCLE_SECONDS}s` }} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <p className="glyph-caption" aria-live="polite">{SUBJECTS[active].caption}</p>
    </div>
  );
}

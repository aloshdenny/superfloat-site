import { useEffect, useRef, useState } from "react";

// Same order as buildSubjects() in subjects.js. Kept here so the page doesn't load three.js to caption the stage.
const SUBJECTS = [
  { caption: "THE FORMAT / SF4 → SF16", description: "the Superfloat mark" },
  { caption: "ATREIDES / 4 TILES · 256 MACS", description: "the Atreides chip package" },
  { caption: "16 × 16 PROCESSING ELEMENTS", description: "a 16 by 16 systolic array" },
];

export default function GlyphHero() {
  const stage = useRef(null);
  const canvas = useRef(null);
  const engine = useRef(null);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let disposed = false;
    const cleanups = [];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // three.js and its shader compile wait for the first idle moment after load, so they don't add to the
    // page's blocking time while it becomes interactive; the canvas fades in when ready, as before.
    const idle = () => new Promise((resolve) => {
      const start = () => (window.requestIdleCallback ? window.requestIdleCallback(resolve, { timeout: 2000 }) : setTimeout(resolve, 300));
      if (document.readyState === "complete") start();
      else window.addEventListener("load", start, { once: true });
    });

    idle()
      .then(() => (disposed ? null : import("./engine.js")))
      .then((module) => {
        if (disposed || !module) return;
        const { createGlyphHero } = module;
        const hero = createGlyphHero(canvas.current, {
          reducedMotion: motion.matches,
          onSubject: setActive,
        });
        engine.current = hero;
        setStatus("ready");

        let inView = false;
        const sync = () => {
          if (inView && !document.hidden && !motion.matches) hero.start();
          else hero.stop();
        };
        const resize = new ResizeObserver(([entry]) => hero.resize(entry.contentRect.width, entry.contentRect.height));
        resize.observe(stage.current);
        const view = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { threshold: 0.05 });
        view.observe(stage.current);
        const onMotion = () => {
          hero.setReducedMotion(motion.matches);
          sync();
        };
        motion.addEventListener("change", onMotion);
        document.addEventListener("visibilitychange", sync);
        cleanups.push(() => {
          resize.disconnect();
          view.disconnect();
          motion.removeEventListener("change", onMotion);
          document.removeEventListener("visibilitychange", sync);
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
    <div className="glyph-hero">
      <div
        ref={stage}
        className="glyph-stage"
        role="button"
        tabIndex={0}
        aria-label={`Animated glyph rendering of ${SUBJECTS[active].description}. Show the next one.`}
        onClick={() => engine.current?.next()}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          engine.current?.next();
        }}
      >
        <canvas ref={canvas} className={`glyph-canvas ${status === "ready" ? "is-ready" : ""}`} aria-hidden="true" />
        {status === "failed" && <p className="glyph-fallback">sƒ · 0101 · 16 × 16</p>}
      </div>
      <p className="glyph-caption" aria-live="polite">{SUBJECTS[active].caption}</p>
    </div>
  );
}

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
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let disposed = false;
    const cleanups = [];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isDark = () => document.documentElement.classList.contains("dark");

    import("./engine.js")
      .then(({ createGlyphHero }) => {
        if (disposed) return;
        const hero = createGlyphHero(canvas.current, {
          dark: isDark(),
          reducedMotion: motion.matches,
          onSubject: setActive,
        });
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
    };
  }, []);

  return (
    <div className="glyph-hero">
      <div ref={stage} className="glyph-stage" role="img" aria-label={`Animated glyph rendering of ${SUBJECTS[active].description}`}>
        <canvas ref={canvas} className={`glyph-canvas ${status === "ready" ? "is-ready" : ""}`} aria-hidden="true" />
        {status === "failed" && <p className="glyph-fallback">sƒ · 0101 · 16 × 16</p>}
      </div>
      <p className="glyph-caption" aria-live="polite">{SUBJECTS[active].caption}</p>
    </div>
  );
}

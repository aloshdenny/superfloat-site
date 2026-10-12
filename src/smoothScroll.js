import Lenis from "lenis";
import "lenis/dist/lenis.css";

// Eased page scrolling (Lenis). Reduced-motion users keep native scrolling, and every helper below
// falls back to it when Lenis is not running.
let lenis = null;
const HEADER_OFFSET = 88; // clears the sticky header when landing on a section

export function startSmoothScroll() {
  if (lenis || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  lenis = new Lenis({ autoRaf: true, lerp: 0.075, wheelMultiplier: 0.9 });
  return () => {
    lenis.destroy();
    lenis = null;
  };
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.4 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

export function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  if (lenis) lenis.scrollTo(target, { offset: -HEADER_OFFSET, duration: 1.6 });
  else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET, behavior: "smooth" });
}

// Instant jump, for route changes.
export function jumpToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo({ top: 0, behavior: "instant" });
}

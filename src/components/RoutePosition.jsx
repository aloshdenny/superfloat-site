import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { jumpToTop, scrollToSection } from "../smoothScroll";

// New pages start at the top. A nav link followed from another page passes the section it wants in
// location state, and the home page scrolls to it once rendered.
export default function RoutePosition() {
  const { pathname, state } = useLocation();
  useLayoutEffect(() => {
    jumpToTop();
    document.title = pathname === "/" ? "Superfloat — Super Intelligence, Done Better" : "Research — Superfloat";
  }, [pathname]);
  useEffect(() => {
    if (!state?.section) return undefined;
    const frame = requestAnimationFrame(() => scrollToSection(state.section));
    return () => cancelAnimationFrame(frame);
  }, [pathname, state]);
  return null;
}

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Elements marked data-reveal fade and rise slowly the first time they scroll into view.
// The state lives in a data-revealed attribute React does not manage, so re-renders keep it.
export default function RevealOnScroll() {
  const { pathname } = useLocation();
  useEffect(() => {
    const items = document.querySelectorAll("[data-reveal]:not([data-revealed])");
    const reveal = (el) => el.setAttribute("data-revealed", "");
    if (!("IntersectionObserver" in window)) {
      items.forEach(reveal);
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);
  return null;
}

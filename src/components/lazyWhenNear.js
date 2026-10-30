import { lazy } from "react";

// A component below the fold that the page should not pay for on load. The build still prerenders it
// in full (scripts/prerender.mjs waits for it), and in the browser React keeps that HTML as it is,
// inside its <Suspense> boundary, until `selector` comes within `margin` of the viewport; only then
// does the component's code load and hydrate. On a client-side navigation to the page the element
// isn't in the document yet, so the code loads straight away.
export default function lazyWhenNear(selector, load, margin = "300px") {
  return lazy(() => {
    if (typeof window === "undefined") return load();
    const target = document.querySelector(selector);
    if (!target || !("IntersectionObserver" in window)) return load();
    return new Promise((resolve) => {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        resolve();
      }, { rootMargin: `${margin} 0px` });
      observer.observe(target);
    }).then(load);
  });
}

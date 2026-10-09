import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function RoutePosition() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.title = pathname === "/" ? "Superfloat — Intelligence at the Bit Level" : "Research — Superfloat";
  }, [pathname]);
  return null;
}

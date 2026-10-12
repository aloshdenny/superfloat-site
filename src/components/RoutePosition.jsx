import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function RoutePosition() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.title = pathname === "/" ? "Superfloat — Super Intelligence, Done Better" : "Research — Superfloat";
  }, [pathname]);
  return null;
}

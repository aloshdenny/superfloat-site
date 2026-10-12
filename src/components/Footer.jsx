import { Link, useLocation } from "react-router-dom";
import { scrollToTop } from "../smoothScroll";

export default function Footer() {
  const { pathname } = useLocation();
  const toTop = (event) => {
    if (pathname !== "/") return;
    event.preventDefault();
    scrollToTop();
  };
  return <footer className="sf-footer"><Link className="sf-brand" to="/" onClick={toTop}>superfloat<span className="brand-period">.</span></Link><span>Scalable precision. AI at the edge.</span><span>© {new Date().getFullYear()} Superfloat</span></footer>;
}

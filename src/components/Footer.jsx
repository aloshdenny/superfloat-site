import { Link, useLocation } from "react-router-dom";
import { scrollToTop } from "../smoothScroll";

export default function Footer() {
  const { pathname } = useLocation();
  const toTop = (event) => {
    if (pathname !== "/") return;
    event.preventDefault();
    scrollToTop();
  };
  return <footer className="sf-footer"><Link className="sf-brand" to="/" onClick={toTop}>superfloat<span className="brand-period">.</span></Link><span>Scalable precision. AI at the edge.</span><nav className="sf-footer__links" aria-label="Footer"><Link to="/about">About</Link><Link to="/blogs">Research</Link><Link to="/investors">Investors</Link><a href="https://docs.superfloat.si">Docs</a><a href="https://github.com/aloshdenny/superfloat">GitHub</a><a href="mailto:alosh@superfloat.si">Contact</a></nav><span>© {new Date().getFullYear()} Superfloat</span></footer>;
}

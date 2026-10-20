import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { scrollToSection, scrollToTop } from "../smoothScroll";

const SECTIONS = [["technology", "Technology"], ["architecture", "Compute lab"], ["applications", "Applications"]];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const onHome = location.pathname === "/";
  // On the home page the brand and section links scroll in place; elsewhere they route home first.
  const toTop = (event) => {
    if (!onHome) return;
    event.preventDefault();
    scrollToTop();
  };
  const toSection = (id) => (event) => {
    event.preventDefault();
    setMenuOpen(false);
    if (onHome) scrollToSection(id);
    else navigate("/", { state: { section: id } });
  };
  useEffect(() => { setMenuOpen(false); }, [location]);
  useEffect(() => {
    const close = (event) => { if (event.key === "Escape" && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); } };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menuOpen]);
  return (
    <header className="sf-header">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <nav className="sf-nav" aria-label="Main navigation">
        <Link to="/" className="sf-brand" aria-label="Superfloat home" onClick={toTop}><span className="brand-symbol" aria-hidden="true">sƒ</span>superfloat<span className="brand-period">.</span></Link>
        <div className={`sf-nav-links ${menuOpen ? "is-open" : ""}`} id="main-navigation" onClick={() => setMenuOpen(false)}>
          {SECTIONS.map(([id, label]) => <a key={id} href={`/#${id}`} onClick={toSection(id)}>{label}</a>)}<Link to="/blogs" aria-current={location.pathname.startsWith("/blogs") ? "page" : undefined}>Research</Link><Link to="/about" aria-current={location.pathname.startsWith("/about") ? "page" : undefined}>About</Link><a href="https://docs.superfloat.si">Docs</a>
        </div>
        <div className="nav-tools">
          <button ref={menuButton} className="menu-button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>
            <span className={`burger ${menuOpen ? "is-open" : ""}`} aria-hidden="true"><i /><i /><i /></span>
          </button>
        </div>
      </nav>
    </header>
  );
}

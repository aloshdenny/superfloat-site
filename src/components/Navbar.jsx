import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const location = useLocation();
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
        <Link to="/" className="sf-brand" aria-label="Superfloat home"><span className="brand-symbol" aria-hidden="true">sƒ</span>superfloat<span className="brand-period">.</span></Link>
        <div className={`sf-nav-links ${menuOpen ? "is-open" : ""}`} id="main-navigation" onClick={() => setMenuOpen(false)}>
          <a href="/#technology">Technology</a><a href="/#architecture">Compute lab</a><a href="/#applications">Applications</a><Link to="/blogs" aria-current={location.pathname.startsWith("/blogs") ? "page" : undefined}>Research</Link>
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

import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    const dark = savedTheme ? savedTheme === "dark" : true;
    document.documentElement.classList.toggle("dark", dark);
    return dark;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const location = useLocation();
  useEffect(() => { setMenuOpen(false); }, [location]);
  useEffect(() => {
    const close = (event) => { if (event.key === "Escape" && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); } };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menuOpen]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    window.dispatchEvent(new CustomEvent("themechange", { detail: { isDark } }));
  }, [isDark]);
  return (
    <header className="sf-header">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <nav className="sf-nav" aria-label="Main navigation">
        <Link to="/" className="sf-brand" aria-label="Superfloat home"><span className="brand-symbol" aria-hidden="true">sƒ</span>superfloat<span className="brand-period">.</span></Link>
        <div className={`sf-nav-links ${menuOpen ? "is-open" : ""}`} id="main-navigation" onClick={() => setMenuOpen(false)}>
          <a href="/#technology">Technology</a><a href="/#architecture">Compute lab</a><a href="/#applications">Applications</a><Link to="/blogs" aria-current={location.pathname.startsWith("/blogs") ? "page" : undefined}>Research</Link>
        </div>
        <div className="nav-tools"><button className="theme-button" onClick={() => setIsDark(!isDark)} aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2" /></svg></button><a className="nav-source" href="https://github.com/aloshdenny/superfloat-site" target="_blank" rel="noreferrer">Source ↗</a><button ref={menuButton} className="menu-button" aria-label="Toggle navigation" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}</button></div>
      </nav>
    </header>
  );
}

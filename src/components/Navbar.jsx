import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <nav className="px-6 py-4 flex justify-between items-center bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 fixed w-full z-50 text-gray-900 dark:text-gray-100 transition-colors">
      <Link to="/" className="text-xl font-iowan">Superfloat</Link>
      <div className="flex items-center space-x-6">
        <button 
          onClick={() => setIsDark(!isDark)} 
          className="focus:outline-none hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Toggle dark mode"
          style={{ fontSize: "18px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          {isDark ? "☀️" : "🌙"}
        </button>
        <Link to="/blogs" className="hover:underline">Blog</Link>
        <Link to="/" className="hover:underline">Home</Link>
      </div>
    </nav>
  );
}

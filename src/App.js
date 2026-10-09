import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import BlogList from "./pages/BlogList";
import BlogPost from "./pages/BlogPost";
import RoutePosition from "./components/RoutePosition";
import './index.css'

export default function App() {
  return (
    <Router>
      <RoutePosition />
      <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Navbar />
        <main id="main-content" className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blogs" element={<BlogList />} />
            <Route path="/blogs/:slug" element={<BlogPost/>} />
            <Route path="*" element={<section className="max-w-3xl mx-auto px-6 py-20"><h1>Page not found.</h1><p>This address does not match a Superfloat page.</p><Link className="sf-button primary" to="/">Return to Superfloat →</Link></section>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

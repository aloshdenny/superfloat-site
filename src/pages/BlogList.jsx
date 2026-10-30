import { Link } from "react-router-dom";
import { POSTS } from "./blogs";

// Every note in src/pages/blogs, numbered in the order they were written.
const blogs = Object.entries(POSTS)
  .map(([slug, post]) => ({ slug, title: post.title, date: post.note, author: post.byline }))
  .sort((a, b) => a.date.localeCompare(b.date, undefined, { numeric: true }));

export default function BlogList() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Research notes</h1>
      <p className="text-lg text-gray-600 dark:text-zinc-400 mb-16">Architecture, arithmetic, and AI at the edge.</p>
      
      <div className="space-y-4">
        {blogs.map((blog) => (
          <Link key={blog.slug} to={`/blogs/${blog.slug}`} className="blog-card" data-reveal="1">
            <span className="text-sm text-gray-500 dark:text-zinc-500 font-iowan">{blog.date}</span>
            <h2 className="text-lg font-bold font-iowan text-gray-900 dark:text-zinc-100 mt-2 mb-1">{blog.title}</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-500 font-iowan mb-0">{blog.author}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

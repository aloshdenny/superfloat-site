import { Link } from "react-router-dom";

export default function BlogList() {
  const blogs = [
    { 
      slug: "accelerated-hardware", 
      title: "Inside the Superfloat compute model",
      date: "Note 01",
      author: "Implementation notes · Interactive lab"
    },
  ];

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Research notes</h1>
      <p className="text-lg text-gray-600 dark:text-zinc-400 mb-16">Architecture, arithmetic, and AI at the edge.</p>
      
      <div className="space-y-12">
        {blogs.map((blog) => (
          <div key={blog.slug} className="flex flex-col sm:flex-row gap-4 sm:gap-12">
            <div className="w-24 flex-shrink-0">
              <span className="text-md text-gray-500 dark:text-zinc-500 font-iowan">{blog.date}</span>
            </div>
            <div className="flex-1">
              <Link to={`/blogs/${blog.slug}`} className="block group">
                <h2 className="text-lg font-bold font-iowan text-gray-900 dark:text-zinc-100 hover:underline transition-colors mb-2">
                  {blog.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-zinc-500 font-iowan">{blog.author}</p>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

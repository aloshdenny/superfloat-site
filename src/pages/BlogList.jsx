import { Link } from "react-router-dom";

export default function BlogList() {
  const blogs = [
    { 
      slug: "defeating-nondeterminism", 
      title: "Defeating Nondeterminism in LLM Inference",
      date: "Sep 10",
      author: "Horace He in collaboration with others at Thinking Machines"
    },
    { 
      slug: "new-datatype", 
      title: "New Datatype: Superfloat Explained",
      date: "Sep 5",
      author: "Research Team"
    },
    { 
      slug: "accelerated-hardware", 
      title: "Accelerated Hardware for AI Edge",
      date: "Aug 28",
      author: "Hardware Team" 
    },
  ];

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white font-iowan">Connectionism</h1>
      <p className="text-lg italic text-gray-600 dark:text-zinc-400 mb-16 font-iowan">Shared science and news from the team</p>
      
      <div className="space-y-12">
        {blogs.map((blog) => (
          <div key={blog.slug} className="flex gap-12">
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
// src/pages/BlogPost.js

import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const loadPost = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Dynamically import the blog post content based on the URL slug
        const module = await import(`./blogs/${slug}.js`);
        if (active) setPost(module.default);
      } catch (err) {
        if (active) setError(`Blog post "${slug}" not found.`);
      } finally {
        if (active) setLoading(false);
      }
    };

    if (slug) {
      loadPost();
    }
    return () => { active = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-center text-gray-600">{error || "Blog post not found."}</p>
        <Link className="sf-button primary" to="/blogs">Back to research →</Link>
      </div>
    );
  }

  return (
    <article className="research-article max-w-4xl mx-auto px-6 py-20 text-gray-900 dark:text-gray-100">
      <Link to="/blogs" className="sf-text-link">← All research notes</Link>
      <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">{post.title}</h1>
      <div 
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />
    </article>
  );
}

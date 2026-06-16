// src/pages/BlogPost.js

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Dynamically import the blog post content based on the URL slug
        const module = await import(`./blogs/${slug}.js`);
        setPost(module.default);
      } catch (err) {
        console.error(`Error loading blog post: ${slug}`, err);
        setError(`Blog post "${slug}" not found.`);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadPost();
    }
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
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-6 py-20 text-gray-900 dark:text-gray-100">
      <h1 className="text-4xl font-bold mb-6 font-iowan text-center text-gray-900 dark:text-white">{post.title}</h1>
      <div 
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />
    </article>
  );
}
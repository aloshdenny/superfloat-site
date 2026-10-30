import { useParams, Link } from "react-router-dom";
import { POSTS } from "./blogs";

export default function BlogPost() {
  const { slug } = useParams();
  const post = POSTS[slug];

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-center text-gray-600">Blog post "{slug}" not found.</p>
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

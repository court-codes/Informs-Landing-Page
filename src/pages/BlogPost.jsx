import { Link, useParams } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import RichText from '../components/RichText.jsx';
import { postDate } from './Blog.jsx';

export default function BlogPost() {
  const { postId } = useParams();
  const { content } = useSite();
  const post = content.blog.find((p) => p.id === postId);

  if (!post) {
    return (
      <section className="section page-section">
        <div className="container narrow centered">
          <h1>Post not found</h1>
          <Link to="/explore/blog" className="btn btn-primary">
            Back to Blog
          </Link>
        </div>
      </section>
    );
  }

  return (
    <article className="section page-section">
      <div className="container narrow">
        <Link to="/explore/blog" className="back-link">
          ← All posts
        </Link>
        <h1 className="post-title">{post.title}</h1>
        <p className="post-meta">
          {postDate(post)}
          {post.author && ` · ${post.author}`}
        </p>
        {post.cover && <img className="post-hero" src={post.cover} alt="" />}
        <RichText html={post.body} className="page-text" />
      </div>
    </article>
  );
}

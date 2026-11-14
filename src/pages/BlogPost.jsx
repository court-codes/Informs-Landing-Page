import { Link, useParams } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import PhotoCarousel from '../components/PhotoCarousel.jsx';
import { normalizePost, postDate } from '../photoPosts.js';

export default function BlogPost() {
  const { postId } = useParams();
  const { content } = useSite();
  const found = content.blog.find((p) => p.id === postId);

  if (!found) {
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

  const post = normalizePost(found);

  return (
    <article className="section page-section">
      <div className="container narrow">
        <Link to="/explore/blog" className="back-link">
          ← All posts
        </Link>
        <PhotoCarousel key={post.id} photos={post.photos} title={post.title || 'Post'} />
        <div className="post-detail">
          {post.date && <p className="post-meta">{postDate(post)}</p>}
          {post.title && <h1 className="post-title">{post.title}</h1>}
          {post.caption && <p className="post-caption">{post.caption}</p>}
        </div>
      </div>
    </article>
  );
}

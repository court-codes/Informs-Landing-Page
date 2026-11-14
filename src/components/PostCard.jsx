import { Link } from 'react-router-dom';
import { postDate } from '../photoPosts.js';

export default function PostCard({ post, to, replace }) {
  return (
    <Link to={to} replace={replace} className="post-card">
      <div className="post-cover">
        {post.photos[0] ? (
          <img src={post.photos[0].url} alt="" loading="lazy" />
        ) : (
          <span className="post-cover-fallback" aria-hidden="true" />
        )}
        {post.photos.length > 1 && <span className="post-photo-count">{post.photos.length} photos</span>}
      </div>
      <div className="post-body">
        {post.date && <p className="post-meta">{postDate(post)}</p>}
        {post.title && <h2>{post.title}</h2>}
        {post.caption && <p className="post-excerpt">{post.caption}</p>}
      </div>
    </Link>
  );
}

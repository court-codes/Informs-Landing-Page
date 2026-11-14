import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import RichText from '../components/RichText.jsx';
import { postDate, publishedPosts } from '../blogPosts.js';

export default function Blog() {
  const { content } = useSite();
  const posts = publishedPosts(content.blog);

  return (
    <section className="section page-section">
      <div className="container">
        <RichText html={content.text.blog.intro} className="page-text centered" />
        {posts.length === 0 ? (
          <p className="empty-state">Our first posts are on the way. Check back soon!</p>
        ) : (
          <div className="card-grid">
            {posts.map((post) => (
              <Link key={post.id} to={`/explore/blog/${post.id}`} className="post-card">
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import RichText from '../components/RichText.jsx';
import { fmtShortDate } from '../dates.js';

export function sortedPosts(posts) {
  return posts.filter((p) => p.title).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function postDate(post) {
  return post.date ? fmtShortDate(new Date(`${post.date}T12:00:00`)) : '';
}

export default function Blog() {
  const { content } = useSite();
  const posts = sortedPosts(content.blog);

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
                  {post.cover ? <img src={post.cover} alt="" loading="lazy" /> : <span className="post-cover-fallback" aria-hidden="true" />}
                </div>
                <div className="post-body">
                  {post.date && <p className="post-meta">{postDate(post)}</p>}
                  <h2>{post.title}</h2>
                  {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}
                  <span className="post-more">Read more →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { useSite } from '../context/SiteContext.jsx';
import RichText from '../components/RichText.jsx';
import PostCard from '../components/PostCard.jsx';
import { blogPosts, publishedPosts } from '../photoPosts.js';

export default function Blog() {
  const { content } = useSite();
  const posts = publishedPosts(blogPosts(content.blog));

  return (
    <section className="section page-section">
      <div className="container">
        <RichText html={content.text.blog.intro} className="page-text centered" />
        {posts.length === 0 ? (
          <p className="empty-state">Our first posts are on the way. Check back soon!</p>
        ) : (
          <div className="card-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} to={`/explore/blog/${post.id}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

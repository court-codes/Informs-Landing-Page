import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import RichText from '../components/RichText.jsx';
import PostCard from '../components/PostCard.jsx';
import PhotoCarousel from '../components/PhotoCarousel.jsx';
import { CloseIcon } from '../components/icons.jsx';
import { galleryPosts, postDate, publishedPosts } from '../photoPosts.js';

function PostLightbox({ post, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const title = post.title || 'Gallery post';

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <button type="button" className="lightbox-close" aria-label="Close" autoFocus>
        <CloseIcon />
      </button>
      <div className="lightbox-post" onClick={(e) => e.stopPropagation()}>
        <PhotoCarousel photos={post.photos} title={title} />
        <div className="lightbox-details">
          {post.date && <p className="post-meta">{postDate(post)}</p>}
          {post.title && <h2>{post.title}</h2>}
          {post.caption && <p className="post-caption">{post.caption}</p>}
        </div>
      </div>
    </div>
  );
}

export default function Gallery() {
  const { content } = useSite();
  const posts = publishedPosts(galleryPosts(content.gallery));
  const [params, setParams] = useSearchParams();
  const open = posts.find((p) => p.id === params.get('post'));
  const close = useCallback(() => setParams({}, { replace: true }), [setParams]);

  return (
    <section className="section page-section">
      <div className="container">
        <RichText html={content.text.gallery.intro} className="page-text centered" />
        {posts.length === 0 ? (
          <p className="empty-state">Photos from our events will be posted here.</p>
        ) : (
          <div className="card-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} to={`?post=${post.id}`} replace />
            ))}
          </div>
        )}
      </div>

      {open && <PostLightbox key={open.id} post={open} onClose={close} />}
    </section>
  );
}

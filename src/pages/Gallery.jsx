import { useEffect, useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';
import RichText from '../components/RichText.jsx';
import { CloseIcon } from '../components/icons.jsx';

export default function Gallery() {
  const { content } = useSite();
  const items = content.gallery.filter((item) => item.url);
  const [openIndex, setOpenIndex] = useState(null);
  const open = openIndex !== null ? items[openIndex] : null;

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenIndex(null);
      if (e.key === 'ArrowRight') setOpenIndex((i) => (i + 1) % items.length);
      if (e.key === 'ArrowLeft') setOpenIndex((i) => (i - 1 + items.length) % items.length);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [openIndex, items.length]);

  return (
    <section className="section page-section">
      <div className="container">
        <RichText html={content.text.gallery.intro} className="page-text centered" />
        {items.length === 0 ? (
          <p className="empty-state">Photos from our events will be posted here.</p>
        ) : (
          <div className="card-grid gallery-grid">
            {items.map((item, index) => (
              <button key={item.id} type="button" className="gallery-card" onClick={() => setOpenIndex(index)}>
                <img src={item.url} alt={item.caption || 'SCU INFORMS event photo'} loading="lazy" />
                {item.caption && <span className="gallery-caption">{item.caption}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={open.caption || 'Photo'} onClick={() => setOpenIndex(null)}>
          <button type="button" className="lightbox-close" aria-label="Close">
            <CloseIcon />
          </button>
          {items.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox-nav prev"
                aria-label="Previous photo"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i - 1 + items.length) % items.length);
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="lightbox-nav next"
                aria-label="Next photo"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((i) => (i + 1) % items.length);
                }}
              >
                ›
              </button>
            </>
          )}
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={open.url} alt={open.caption || 'SCU INFORMS event photo'} />
            {open.caption && <figcaption>{open.caption}</figcaption>}
          </figure>
        </div>
      )}
    </section>
  );
}

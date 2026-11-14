import { useEffect, useRef, useState } from 'react';

export default function PhotoCarousel({ photos, title }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef(null);
  const count = photos.length;

  const go = (delta) => setIndex((i) => (i + delta + count) % count);

  useEffect(() => {
    if (count < 2) return undefined;
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select')) return;
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % count);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [count]);

  if (count === 0) return null;
  const photo = photos[Math.min(index, count - 1)];

  return (
    <div
      className="carousel"
      role="group"
      aria-roledescription="carousel"
      aria-label={title}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStart.current === null || count < 2) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchStart.current = null;
      }}
    >
      <div className="carousel-frame">
        <img key={photo.url} src={photo.url} alt={`${title} — photo ${index + 1} of ${count}`} />
        {count > 1 && (
          <>
            <button type="button" className="carousel-arrow prev" onClick={() => go(-1)} aria-label="Previous photo">
              ‹
            </button>
            <button type="button" className="carousel-arrow next" onClick={() => go(1)} aria-label="Next photo">
              ›
            </button>
            <span className="carousel-count" aria-live="polite">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="carousel-dots">
          {photos.map((p, i) => (
            <button
              key={p.id || p.url}
              type="button"
              className={i === index ? 'active' : ''}
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

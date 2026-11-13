import { useSite } from '../context/SiteContext.jsx';
import RichText from '../components/RichText.jsx';

export default function Chapter() {
  const { content } = useSite();
  const images = content.chapterImages.filter((img) => img.url);

  return (
    <section className="section page-section">
      <div className="container narrow">
        <RichText html={content.text.chapter.body} className="page-text" />
      </div>
      {images.length > 0 && (
        <div className="container">
          <div className="photo-grid">
            {images.map((img) => (
              <figure key={img.id} className="photo-card">
                <img src={img.url} alt={img.caption || 'SCU INFORMS chapter'} loading="lazy" />
                {img.caption && <figcaption>{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

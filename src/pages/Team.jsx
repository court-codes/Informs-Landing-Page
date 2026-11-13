import { useSite } from '../context/SiteContext.jsx';
import RichText from '../components/RichText.jsx';

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function Team() {
  const { content } = useSite();
  const members = content.team.filter((m) => m.name);

  return (
    <section className="section page-section">
      <div className="container">
        <RichText html={content.text.team.intro} className="page-text centered" />
        {members.length === 0 ? (
          <p className="empty-state">Our board will be introduced here soon.</p>
        ) : (
          <div className="team-grid">
            {members.map((m) => (
              <article key={m.id} className="team-card">
                <div className="team-photo">
                  {m.photo ? <img src={m.photo} alt={m.name} loading="lazy" /> : <span>{initials(m.name)}</span>}
                </div>
                <div className="team-info">
                  <h2>{m.name}</h2>
                  {m.position && <p className="team-position">{m.position}</p>}
                  {m.gradYear && <p>Class of {m.gradYear}</p>}
                  {m.major && <p>{m.major}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

import { useSite } from '../context/SiteContext.jsx';
import RichText from '../components/RichText.jsx';
import CtaButton from '../components/CtaButton.jsx';

export default function Home() {
  const { content } = useSite();
  const t = content.text.home;

  return (
    <>
      <section className="hero">
        <div className="hero-decor" aria-hidden="true">
          <svg viewBox="0 0 600 400" preserveAspectRatio="none">
            <path d="M-20 360 C 160 420, 420 330, 620 40" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          </svg>
        </div>
        <div className="container hero-inner">
          <RichText html={t.hero} className="hero-text" />
          <div className="cta-row">
            <CtaButton buttonKey="join" cta="join" variant="primary" size="lg" />
            <CtaButton buttonKey="newsletter" cta="newsletter" variant="secondary" size="lg" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container two-col">
          <div className="card card-accent-blue">
            <RichText html={t.whatIs} />
          </div>
          <div className="card card-vision">
            <RichText html={t.vision} />
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <RichText html={t.whoFor} className="card-list centered" />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <RichText html={t.gainIntro} className="centered" />
          <div className="two-col gain-cols">
            <div className="card card-accent-green">
              <RichText html={t.gainPersonal} className="check-list" />
            </div>
            <div className="card card-accent-blue">
              <RichText html={t.gainProfessional} className="check-list" />
            </div>
          </div>
        </div>
      </section>

      <section className="section section-tint-green">
        <div className="container">
          <RichText html={t.mainEvents} className="card-list event-types centered" />
        </div>
      </section>

      <section className="closing-cta">
        <div className="container closing-inner">
          <RichText html={t.closing} className="closing-text" />
          <div className="cta-row">
            <CtaButton buttonKey="joinClosing" cta="join" variant="accent" size="lg" />
            <CtaButton buttonKey="newsletter" cta="newsletter" variant="ghost-light" size="lg" />
          </div>
        </div>
      </section>
    </>
  );
}

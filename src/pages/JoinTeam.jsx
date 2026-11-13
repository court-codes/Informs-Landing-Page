import { useSite } from '../context/SiteContext.jsx';
import RichText from '../components/RichText.jsx';
import CtaButton from '../components/CtaButton.jsx';
import SocialLinks from '../components/SocialLinks.jsx';

export default function JoinTeam() {
  const { content } = useSite();
  return (
    <section className="section page-section">
      <div className="container narrow centered">
        <RichText html={content.text.joinTeam.body} className="page-text" />
        <div className="cta-row center">
          <CtaButton buttonKey="joinTeam" variant="primary" size="lg" />
          <CtaButton buttonKey="newsletter" cta="newsletter" variant="secondary" size="lg" />
        </div>
        <SocialLinks variant="buttons" />
      </div>
    </section>
  );
}

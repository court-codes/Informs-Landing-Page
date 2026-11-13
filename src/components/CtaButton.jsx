import { useSite } from '../context/SiteContext.jsx';
import { trackCtaClick } from '../tracking.js';

export default function CtaButton({ buttonKey, cta, variant = 'primary', size }) {
  const { content } = useSite();
  const button = content.buttons[buttonKey];
  if (!button?.url || !button?.text) return null;

  return (
    <a
      className={`btn btn-${variant}${size ? ` btn-${size}` : ''}`}
      href={button.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => cta && trackCtaClick(cta, buttonKey)}
    >
      {button.text}
    </a>
  );
}

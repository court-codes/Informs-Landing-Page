import { useSite } from '../context/SiteContext.jsx';

function InformsMark() {
  return (
    <svg viewBox="0 0 64 64" className="logo-mark" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#1b3c9e" />
      <path d="M10 44 C 24 52, 44 44, 54 18" fill="none" stroke="#7ac143" strokeWidth="5" strokeLinecap="round" />
      <path d="M46 16 L56 14 L54 24 Z" fill="#7ac143" />
      <circle cx="20" cy="22" r="5" fill="#f5a623" />
    </svg>
  );
}

export function HeaderLogo() {
  const { content } = useSite();
  if (content.branding.headerLogo) {
    return <img className="logo-img" src={content.branding.headerLogo} alt="SCU INFORMS" />;
  }
  return (
    <span className="logo-default">
      <InformsMark />
      <span className="logo-text">
        <strong>INFORMS</strong>
        <small>Santa Clara University</small>
      </span>
    </span>
  );
}

export function FooterLogo() {
  const { content } = useSite();
  if (content.branding.footerLogo) {
    return <img className="footer-logo-img" src={content.branding.footerLogo} alt="Santa Clara University" />;
  }
  return (
    <span className="footer-logo-default">
      <span>Santa Clara</span>
      <span>University</span>
    </span>
  );
}

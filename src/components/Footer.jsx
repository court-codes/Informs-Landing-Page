import { Link } from 'react-router-dom';
import { NAV } from '../siteConfig.js';
import { useSite } from '../context/SiteContext.jsx';
import { FooterLogo } from './Logos.jsx';
import SocialLinks from './SocialLinks.jsx';

export default function Footer() {
  const { content } = useSite();
  const email = content.links.contactEmail;

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a href="https://www.scu.edu" target="_blank" rel="noopener noreferrer" aria-label="Santa Clara University">
            <FooterLogo />
          </a>
          <p>The Santa Clara University student chapter of INFORMS, the Institute for Operations Research and the Management Sciences.</p>
        </div>

        <div className="footer-links">
          <h2 className="footer-heading">Quick Links</h2>
          <ul>
            {NAV.flatMap((item) => (item.children ? item.children : [item])).map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
            <li>
              <Link to="/board/login">Board Login</Link>
            </li>
          </ul>
        </div>

        <div className="footer-connect">
          <h2 className="footer-heading">Connect</h2>
          <SocialLinks />
          {email && (
            <a className="footer-email" href={`mailto:${email}`}>
              {email}
            </a>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">© {new Date().getFullYear()} SCU INFORMS. All rights reserved.</div>
      </div>
    </footer>
  );
}

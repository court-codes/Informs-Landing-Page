import { useSite } from '../context/SiteContext.jsx';
import { DiscordIcon, InstagramIcon, LinkedInIcon } from './icons.jsx';

const NETWORKS = [
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'linkedin', label: 'LinkedIn', Icon: LinkedInIcon },
  { key: 'discord', label: 'Discord', Icon: DiscordIcon },
];

export default function SocialLinks({ variant = 'icons' }) {
  const { content } = useSite();
  return (
    <div className={`social-links social-${variant}`}>
      {NETWORKS.filter(({ key }) => content.links[key]).map(({ key, label, Icon }) => (
        <a
          key={key}
          href={content.links[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={variant === 'icons' ? `SCU INFORMS on ${label}` : undefined}
          className={`social-link social-${key}`}
        >
          <Icon />
          {variant === 'buttons' && <span>{label}</span>}
        </a>
      ))}
    </div>
  );
}

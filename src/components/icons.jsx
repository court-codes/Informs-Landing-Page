const base = { width: 20, height: 20, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false' };

export const InstagramIcon = (props) => (
  <svg {...base} {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const LinkedInIcon = (props) => (
  <svg {...base} {...props} fill="currentColor">
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4v11H3v-11Zm6.5 0h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1v5.36h-4v-4.75c0-1.13-.02-2.59-1.58-2.59-1.58 0-1.82 1.23-1.82 2.5v4.84h-4v-11Z" />
  </svg>
);

export const DiscordIcon = (props) => (
  <svg {...base} {...props} fill="currentColor">
    <path d="M19.6 5.3A16.6 16.6 0 0 0 15.5 4l-.5 1.1a15.4 15.4 0 0 0-6 0L8.5 4a16.6 16.6 0 0 0-4.1 1.3C1.8 9.2 1.1 13 1.4 16.7a16.7 16.7 0 0 0 5.1 2.6l1.1-1.5c-.6-.2-1.2-.5-1.7-.9l.4-.3a11.9 11.9 0 0 0 11.4 0l.4.3c-.5.4-1.1.7-1.7.9l1.1 1.5a16.6 16.6 0 0 0 5.1-2.6c.4-4.3-.7-8.1-3-11.4ZM8.7 14.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
  </svg>
);

export const MailIcon = (props) => (
  <svg {...base} {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

export const PinIcon = (props) => (
  <svg {...base} {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export const ChevronIcon = (props) => (
  <svg {...base} {...props} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const MenuIcon = (props) => (
  <svg {...base} {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (props) => (
  <svg {...base} {...props} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

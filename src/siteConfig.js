export const NAV = [
  { label: 'Home', to: '/' },
  {
    label: 'About',
    to: '/about',
    children: [
      { label: 'SCU Chapter', to: '/about/chapter' },
      { label: 'Meet the Team', to: '/about/team' },
      { label: 'Join the Team', to: '/about/join' },
    ],
  },
  { label: 'Events Schedule', to: '/events' },
  {
    label: 'Explore',
    to: '/explore',
    children: [
      { label: 'Blog', to: '/explore/blog' },
      { label: 'Gallery', to: '/explore/gallery' },
    ],
  },
  { label: 'Contact', to: '/contact' },
];

export const PAGE_TITLES = {
  '/': 'Home',
  '/about/chapter': 'SCU Chapter',
  '/about/team': 'Meet the Team',
  '/about/join': 'Join the Team',
  '/events': 'Events Schedule',
  '/explore/blog': 'Blog',
  '/explore/gallery': 'Gallery',
  '/contact': 'Contact',
  '/board/login': 'Board Login',
  '/board/analytics': 'Analytics',
  '/board/edit': 'Edit Content',
};

export function pageLabel(path) {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  if (path.startsWith('/explore/blog/')) return 'Blog post';
  return path;
}

// Rich-text sections the board can edit, grouped by page.
export const TEXT_SECTIONS = [
  {
    page: 'home',
    label: 'Home',
    path: '/',
    sections: [
      { key: 'hero', label: 'Hero (top of page)' },
      { key: 'whatIs', label: 'What is INFORMS?' },
      { key: 'vision', label: 'Vision statement' },
      { key: 'whoFor', label: 'Who is it for? (bullets become cards)' },
      { key: 'gainIntro', label: 'What you will gain — heading' },
      { key: 'gainPersonal', label: 'Personal Growth' },
      { key: 'gainProfessional', label: 'Professional Growth' },
      { key: 'mainEvents', label: 'Main events (bullets become cards)' },
      { key: 'closing', label: 'Closing call to action' },
    ],
  },
  { page: 'chapter', label: 'About — SCU Chapter', path: '/about/chapter', sections: [{ key: 'body', label: 'Page text' }] },
  { page: 'team', label: 'About — Meet the Team', path: '/about/team', sections: [{ key: 'intro', label: 'Intro' }] },
  { page: 'joinTeam', label: 'About — Join the Team', path: '/about/join', sections: [{ key: 'body', label: 'Page text' }] },
  { page: 'events', label: 'Events Schedule', path: '/events', sections: [{ key: 'intro', label: 'Intro' }] },
  { page: 'blog', label: 'Explore — Blog', path: '/explore/blog', sections: [{ key: 'intro', label: 'Intro' }] },
  { page: 'gallery', label: 'Explore — Gallery', path: '/explore/gallery', sections: [{ key: 'intro', label: 'Intro' }] },
  { page: 'contact', label: 'Contact', path: '/contact', sections: [{ key: 'intro', label: 'Intro' }] },
];

export const BUTTONS = [
  { key: 'join', label: 'Join INFORMS (Home, top)', note: 'Clicks count toward the Join INFORMS conversion rate.' },
  { key: 'newsletter', label: 'Join Newsletter (Home)', note: 'Clicks count toward the Newsletter conversion rate.' },
  { key: 'joinClosing', label: 'Join INFORMS (Home, bottom banner)', note: 'Clicks count toward the Join INFORMS conversion rate.' },
  { key: 'joinTeam', label: 'Join the Team page', note: 'Leave the link empty to hide the button while applications are closed.' },
];

// Which editor tab "Edit this page" opens for a given public path.
export function editorTargetFor(path) {
  if (path.startsWith('/explore/blog')) return '/board/edit?tab=blog';
  if (path === '/explore/gallery') return '/board/edit?tab=gallery';
  if (path === '/about/team') return '/board/edit?tab=team';
  if (path === '/events') return '/board/edit?tab=events';
  const match = TEXT_SECTIONS.find((p) => p.path === path);
  return match ? `/board/edit?tab=text&page=${match.page}` : '/board/edit';
}

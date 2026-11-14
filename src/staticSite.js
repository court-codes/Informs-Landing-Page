// True for builds published to static hosts like GitHub Pages, which can't run the API server.
export const STATIC_SITE = import.meta.env.VITE_STATIC === 'true';

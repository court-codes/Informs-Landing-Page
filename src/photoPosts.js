import { fmtShortDate } from './dates.js';

// Older blog posts had a single cover image and an excerpt; they become a one-photo post with a caption.
export function normalizePost(post) {
  const photos = Array.isArray(post.photos)
    ? post.photos.filter((p) => p?.url)
    : post.cover
      ? [{ id: `${post.id}-cover`, url: post.cover }]
      : [];
  return {
    id: post.id,
    title: post.title || '',
    date: post.date || '',
    caption: post.caption ?? post.excerpt ?? '',
    photos,
  };
}

export const blogPosts = (items) => items.map(normalizePost);

// Older gallery items were single photos ({ id, url, caption }) with no photos list; they are dropped, not converted.
export const galleryPosts = (items) => items.filter((item) => Array.isArray(item.photos)).map(normalizePost);

export function publishedPosts(posts) {
  return posts.filter((p) => p.title || p.photos.length).sort((a, b) => b.date.localeCompare(a.date));
}

export function postDate(post) {
  return post.date ? fmtShortDate(new Date(`${post.date}T12:00:00`)) : '';
}

import { defaultContent } from './defaultContent.js';

function mergeDefaults(defaults, value) {
  if (Array.isArray(defaults)) return Array.isArray(value) ? value : defaults;
  if (defaults && typeof defaults === 'object') {
    const out = {};
    const src = value && typeof value === 'object' ? value : {};
    for (const key of Object.keys(defaults)) out[key] = mergeDefaults(defaults[key], src[key]);
    for (const key of Object.keys(src)) if (!(key in out)) out[key] = src[key];
    return out;
  }
  return value === undefined ? defaults : value;
}

// Fills in any sections missing from saved content (e.g. ones added in a later version of the site).
export function withDefaults(content) {
  return mergeDefaults(defaultContent, content);
}

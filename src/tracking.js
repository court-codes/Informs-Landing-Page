const VISITOR_KEY = 'informs_visitor_id';
const SESSION_KEY = 'informs_session_id';

let enabled = false;
let current = null;

function storedId(storage, key) {
  try {
    let value = storage.getItem(key);
    if (!value) {
      value = crypto.randomUUID();
      storage.setItem(key, value);
    }
    return value;
  } catch {
    return crypto.randomUUID();
  }
}

const visitorId = () => storedId(localStorage, VISITOR_KEY);
const sessionId = () => storedId(sessionStorage, SESSION_KEY);

function beacon(path, payload) {
  const body = JSON.stringify(payload);
  const url = `/api/analytics${path}`;
  if (navigator.sendBeacon?.(url, new Blob([body], { type: 'text/plain' }))) return;
  fetch(url, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
}

function activeSeconds(view) {
  let ms = view.activeMs;
  if (view.since !== null) ms += performance.now() - view.since;
  return ms / 1000;
}

function flush() {
  if (current?.id) beacon('/engagement', { id: current.id, seconds: activeSeconds(current) });
}

export function setTrackingEnabled(value) {
  if (!value) endPageview();
  enabled = value;
}

export function trackPageview(path) {
  if (!enabled) return;
  if (current && current.path === path && performance.now() - current.startedAt < 1000) return;
  endPageview();
  const view = {
    id: null,
    path,
    startedAt: performance.now(),
    activeMs: 0,
    since: document.visibilityState === 'visible' ? performance.now() : null,
  };
  current = view;
  fetch('/api/analytics/pageview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId: visitorId(), sessionId: sessionId(), path }),
  })
    .then((res) => res.json())
    .then((data) => {
      view.id = data.id;
    })
    .catch(() => {});
}

export function endPageview() {
  if (!current) return;
  flush();
  current = null;
}

export function trackCtaClick(cta, source) {
  if (!enabled) return;
  beacon('/click', { visitorId: visitorId(), cta, source, path: window.location.pathname });
}

document.addEventListener('visibilitychange', () => {
  if (!current) return;
  if (document.visibilityState === 'hidden') {
    if (current.since !== null) {
      current.activeMs += performance.now() - current.since;
      current.since = null;
    }
    flush();
  } else {
    current.since = performance.now();
  }
});

window.addEventListener('pagehide', flush);

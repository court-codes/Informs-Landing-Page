import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { STATIC_SITE } from '../staticSite.js';
import { defaultContent } from '../../server/defaultContent.js';

const SiteContext = createContext(null);

const SIGNED_OUT = { loading: false, registered: false, authenticated: false, email: null };

// Static hosts (GitHub Pages, Cloudflare) have no API: /api/content comes back as a 404 or as the app's own HTML.
async function loadContent() {
  if (STATIC_SITE) return { content: defaultContent, staticSite: true };
  const res = await fetch('/api/content', { credentials: 'same-origin' });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  if (res.ok && isJson) return { content: await res.json(), staticSite: false };
  if (res.status === 404 || res.status === 405 || (res.ok && !isJson)) return { content: defaultContent, staticSite: true };
  throw new Error(`Request failed (${res.status})`);
}

export function SiteProvider({ children }) {
  const [content, setContent] = useState(null);
  const [staticSite, setStaticSite] = useState(STATIC_SITE);
  const [loadError, setLoadError] = useState(null);
  const [auth, setAuth] = useState({ ...SIGNED_OUT, loading: true });

  const refreshAuth = useCallback(async () => {
    try {
      const status = await api('/auth/status');
      setAuth({ loading: false, ...status });
      return status;
    } catch {
      setAuth((prev) => ({ ...prev, loading: false }));
      return null;
    }
  }, []);

  useEffect(() => {
    loadContent()
      .then((result) => {
        setContent(result.content);
        setStaticSite(result.staticSite);
        if (result.staticSite) setAuth(SIGNED_OUT);
        else refreshAuth();
      })
      .catch((err) => setLoadError(err.message));
  }, [refreshAuth]);

  const saveContent = useCallback(async (next) => {
    const saved = await api('/content', { method: 'PUT', body: next });
    setContent(saved);
    return saved;
  }, []);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    await refreshAuth();
  }, [refreshAuth]);

  const value = useMemo(
    () => ({ content, staticSite, loadError, auth, refreshAuth, saveContent, logout }),
    [content, staticSite, loadError, auth, refreshAuth, saveContent, logout],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}

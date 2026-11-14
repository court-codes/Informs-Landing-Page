import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { STATIC_SITE } from '../staticSite.js';
import { defaultContent } from '../../server/defaultContent.js';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [content, setContent] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [auth, setAuth] = useState({ loading: true, registered: false, authenticated: false, email: null });

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
    if (STATIC_SITE) {
      setContent(defaultContent);
      setAuth({ loading: false, registered: false, authenticated: false, email: null });
      return;
    }
    api('/content').then(setContent).catch((err) => setLoadError(err.message));
    refreshAuth();
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
    () => ({ content, loadError, auth, refreshAuth, saveContent, logout }),
    [content, loadError, auth, refreshAuth, saveContent, logout],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}

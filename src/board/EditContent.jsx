import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import { setIn } from './listUtils.js';
import TextEditor from './editors/TextEditor.jsx';
import ButtonsEditor from './editors/ButtonsEditor.jsx';
import EventsEditor from './editors/EventsEditor.jsx';
import TeamEditor from './editors/TeamEditor.jsx';
import ImageListEditor from './editors/ImageListEditor.jsx';
import BlogEditor from './editors/BlogEditor.jsx';
import BrandingEditor from './editors/BrandingEditor.jsx';

const TABS = [
  { id: 'text', label: 'Page Text' },
  { id: 'buttons', label: 'Buttons & Links' },
  { id: 'events', label: 'Events' },
  { id: 'team', label: 'Meet the Team' },
  { id: 'chapter', label: 'SCU Chapter Photos' },
  { id: 'blog', label: 'Blog' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'branding', label: 'Logos' },
];

// Unsaved edits survive switching to Audience View and back within the same tab.
let pendingDraft = null;

export default function EditContent() {
  const { content, saveContent } = useSite();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'text';
  const page = params.get('page') || 'home';

  const [draft, setDraft] = useState(() => pendingDraft || structuredClone(content));
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(content), [draft, content]);

  useEffect(() => {
    pendingDraft = dirty ? draft : null;
  }, [draft, dirty]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const update = useCallback((path, value) => {
    setDraft((d) => setIn(d, path, value));
    setStatus({ state: 'idle', message: '' });
  }, []);

  const save = async () => {
    setStatus({ state: 'saving', message: '' });
    try {
      const saved = await saveContent(draft);
      setDraft(saved);
      setStatus({ state: 'saved', message: 'Saved! Changes are live on the site.' });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  };

  const discard = () => {
    if (!window.confirm('Discard all unsaved changes?')) return;
    setDraft(structuredClone(content));
    setVersion((v) => v + 1);
    setStatus({ state: 'idle', message: '' });
  };

  const selectTab = (id) => setParams(id === 'text' ? { tab: id, page } : { tab: id });

  const props = { draft, update, version };

  return (
    <div className="board-page editor-layout">
      <aside className="editor-sidebar">
        <h1>Edit Content</h1>
        <nav aria-label="Content sections">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`sidebar-tab${t.id === tab ? ' active' : ''}`} onClick={() => selectTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="editor-main">
        <div className={`save-bar${dirty ? ' dirty' : ''}`}>
          <span className="save-state" role="status">
            {status.state === 'error'
              ? status.message
              : dirty
                ? 'You have unsaved changes'
                : status.message || 'All changes saved'}
          </span>
          <div className="save-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={discard} disabled={!dirty || status.state === 'saving'}>
              Discard
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={!dirty || status.state === 'saving'}>
              {status.state === 'saving' ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>

        {tab === 'text' && <TextEditor {...props} page={page} onPageChange={(p) => setParams({ tab: 'text', page: p })} />}
        {tab === 'buttons' && <ButtonsEditor {...props} />}
        {tab === 'events' && <EventsEditor {...props} />}
        {tab === 'team' && <TeamEditor {...props} />}
        {tab === 'chapter' && (
          <ImageListEditor
            title="SCU Chapter Photos"
            description="Photos shown below the text on the About → SCU Chapter page."
            items={draft.chapterImages}
            onChange={(next) => update(['chapterImages'], next)}
            viewPath="/about/chapter"
          />
        )}
        {tab === 'blog' && <BlogEditor {...props} />}
        {tab === 'gallery' && (
          <ImageListEditor
            title="Gallery"
            description="Photos shown on the Explore → Gallery page, in this order."
            items={draft.gallery}
            onChange={(next) => update(['gallery'], next)}
            viewPath="/explore/gallery"
          />
        )}
        {tab === 'branding' && <BrandingEditor {...props} />}
      </div>
    </div>
  );
}

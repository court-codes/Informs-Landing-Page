import { Link } from 'react-router-dom';
import { TEXT_SECTIONS } from '../../siteConfig.js';
import RichTextEditor from '../RichTextEditor.jsx';

export default function TextEditor({ draft, update, version, page, onPageChange }) {
  const current = TEXT_SECTIONS.find((p) => p.page === page) || TEXT_SECTIONS[0];

  return (
    <div className="editor-panel">
      <div className="editor-head">
        <div>
          <h2>Page Text</h2>
          <p className="muted">Pick a page, then edit each section. Use Heading and Subheading for titles, and lists for bullet points.</p>
        </div>
        <Link to={current.path} className="btn btn-ghost btn-sm">
          View page ↗
        </Link>
      </div>

      <div className="pill-tabs" role="tablist" aria-label="Page">
        {TEXT_SECTIONS.map((p) => (
          <button
            key={p.page}
            type="button"
            role="tab"
            aria-selected={p.page === current.page}
            className={`pill${p.page === current.page ? ' active' : ''}`}
            onClick={() => onPageChange(p.page)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {current.sections.map((section) => (
        <div key={section.key} className="field-block">
          <h3 className="field-label">{section.label}</h3>
          <RichTextEditor
            key={`${version}-${current.page}-${section.key}`}
            label={section.label}
            value={draft.text[current.page][section.key]}
            onChange={(html) => update(['text', current.page, section.key], html)}
          />
        </div>
      ))}
    </div>
  );
}

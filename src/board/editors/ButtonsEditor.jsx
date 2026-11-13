import { BUTTONS } from '../../siteConfig.js';

function formLinkWarning(url) {
  if (!url || !url.includes('docs.google.com/forms')) return '';
  if (/\/edit(\b|#|$)/.test(url)) {
    return 'This looks like the Google Form editor link, which visitors can’t open. Use the form’s “Send → Link” URL (ending in /viewform) instead.';
  }
  if (url.includes('alreadyresponded')) {
    return 'This link shows the “You’ve already responded” page. Use the form’s “Send → Link” URL (ending in /viewform) instead.';
  }
  return '';
}

const SOCIAL = [
  { key: 'instagram', label: 'Instagram URL' },
  { key: 'linkedin', label: 'LinkedIn URL' },
  { key: 'discord', label: 'Discord invite URL' },
  { key: 'contactEmail', label: 'Contact email', type: 'email' },
];

export default function ButtonsEditor({ draft, update }) {
  return (
    <div className="editor-panel">
      <div className="editor-head">
        <div>
          <h2>Buttons & Links</h2>
          <p className="muted">Change the text and destination of each button on the site.</p>
        </div>
      </div>

      {BUTTONS.map(({ key, label, note }) => {
        const button = draft.buttons[key];
        const warning = formLinkWarning(button.url);
        return (
          <fieldset key={key} className="card field-card">
            <legend>{label}</legend>
            <div className="field-row">
              <label>
                Button text
                <input type="text" value={button.text} onChange={(e) => update(['buttons', key, 'text'], e.target.value)} />
              </label>
              <label className="grow">
                Link
                <input type="url" value={button.url} placeholder="https://" onChange={(e) => update(['buttons', key, 'url'], e.target.value.trim())} />
              </label>
            </div>
            <p className="hint">{note}</p>
            {warning && <p className="form-status warning">{warning}</p>}
          </fieldset>
        );
      })}

      <fieldset className="card field-card">
        <legend>Social media & email</legend>
        {SOCIAL.map(({ key, label, type }) => (
          <label key={key}>
            {label}
            <input type={type || 'url'} value={draft.links[key]} onChange={(e) => update(['links', key], e.target.value.trim())} />
          </label>
        ))}
      </fieldset>
    </div>
  );
}

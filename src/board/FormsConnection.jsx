import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useSite } from '../context/SiteContext.jsx';

const SITE_URL_KEY = 'informs_forms_site_url';

const FORMS = [
  { key: 'join', title: 'Join INFORMS form', buttonKey: 'join' },
  { key: 'newsletter', title: 'Newsletter form', buttonKey: 'newsletter' },
];

function buildScript({ siteUrl, secret, form }) {
  return `// SCU INFORMS website connection — reports form completions to the board dashboard.
const SITE_URL = '${siteUrl}';
const SECRET = '${secret}';
const FORM = '${form}';

// Run this once: it installs the submit trigger and sends a test to the website.
function setup() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'onFormSubmit')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onFormSubmit').forForm(FormApp.getActiveForm()).onFormSubmit().create();
  const res = report_(true);
  Logger.log('Website responded: ' + res.getResponseCode() + ' ' + res.getContentText());
}

function onFormSubmit() {
  report_(false);
}

function report_(test) {
  return UrlFetchApp.fetch(SITE_URL + '/api/analytics/form-submission', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ form: FORM, secret: SECRET, test: test }),
    muteHttpExceptions: true,
  });
}
`;
}

const isLocalUrl = (url) => /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(url);

function formatWhen(ts) {
  return ts ? new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

function StatusBadge({ status }) {
  if (status.lastSubmissionAt) return <span className="badge badge-green">Connected · receiving responses</span>;
  if (status.lastTestAt) return <span className="badge badge-green">Connected · test received</span>;
  return <span className="badge">Not connected</span>;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-primary btn-sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? 'Copied!' : 'Copy script'}
    </button>
  );
}

export default function FormsConnection() {
  const { content } = useSite();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [siteUrl, setSiteUrl] = useState(() => localStorage.getItem(SITE_URL_KEY) || window.location.origin);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await api('/analytics/forms'));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateSiteUrl = (value) => {
    const clean = value.trim().replace(/\/+$/, '');
    setSiteUrl(clean);
    localStorage.setItem(SITE_URL_KEY, clean);
  };

  const rotate = async () => {
    if (!window.confirm('Create a new secret? Both Google Forms will stop reporting until you paste the updated scripts into them.')) return;
    try {
      await api('/analytics/forms/rotate-secret', { method: 'POST' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="board-page container">
      <div className="board-page-head">
        <div>
          <Link to="/board/analytics" className="back-link">
            ← Analytics
          </Link>
          <h1>Google Forms connection</h1>
          <p className="muted">
            Connect each Google Form so the Analytics page can count how many people completed it after clicking the button on the site.
          </p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={load} disabled={refreshing}>
          {refreshing ? 'Checking…' : 'Refresh status'}
        </button>
      </div>

      {error && <p className="form-status error">{error}</p>}
      {!data && !error && <p className="muted">Loading…</p>}

      {data && (
        <>
          <div className="card field-card">
            <label>
              Website address (where Google should send completions)
              <input type="url" value={siteUrl} onChange={(e) => updateSiteUrl(e.target.value)} />
            </label>
            {isLocalUrl(siteUrl) ? (
              <p className="form-status warning">
                Google can’t reach a site running on your own computer ({siteUrl}). Put the site online first, then open this page on the live site (or
                type its address above) and copy the scripts from there.
              </p>
            ) : (
              <p className="hint">The scripts below send completions to this address.</p>
            )}
          </div>

          {FORMS.map(({ key, title, buttonKey }) => {
            const status = data.forms[key];
            const formUrl = content.buttons[buttonKey]?.url;
            return (
              <section key={key} className="card forms-card">
                <div className="forms-card-head">
                  <h2>{title}</h2>
                  <StatusBadge status={status} />
                </div>
                <p className="muted forms-meta">
                  {status.lastSubmissionAt && `Last response ${formatWhen(status.lastSubmissionAt)} · ${status.totalSubmissions} total. `}
                  {status.lastTestAt && `Last test ${formatWhen(status.lastTestAt)}.`}
                  {!status.connected && 'No test or response received yet.'}
                  {formUrl && (
                    <>
                      {' '}
                      Button currently links to{' '}
                      <a href={formUrl} target="_blank" rel="noopener noreferrer">
                        this form
                      </a>
                      .
                    </>
                  )}
                </p>

                <ol className="forms-steps">
                  <li>
                    Open the form in{' '}
                    <a href="https://docs.google.com/forms/" target="_blank" rel="noopener noreferrer">
                      Google Forms
                    </a>{' '}
                    as an editor (the editing view, not the public link).
                  </li>
                  <li>
                    Click the <strong>⋮</strong> menu (top right) → <strong>Apps Script</strong>.
                  </li>
                  <li>Delete everything in the editor, paste the script below, and click the save icon.</li>
                  <li>
                    In the toolbar, pick <strong>setup</strong> from the function menu and click <strong>Run</strong>. Approve the permissions Google asks for
                    (choose your account → Advanced → Go to project → Allow).
                  </li>
                  <li>
                    Come back here and click <strong>Refresh status</strong>. It should say “Connected · test received”.
                  </li>
                </ol>

                <div className="script-box">
                  <div className="script-box-head">
                    <span>Apps Script for the {title}</span>
                    <CopyButton text={buildScript({ siteUrl, secret: data.secret, form: key })} />
                  </div>
                  <pre>
                    <code>{buildScript({ siteUrl, secret: data.secret, form: key })}</code>
                  </pre>
                </div>
              </section>
            );
          })}

          <div className="card field-card">
            <h3 className="field-label">Connection secret</h3>
            <p className="hint">
              The scripts include a private secret so only your forms can report completions. If it ever leaks, create a new one and paste the updated
              scripts into both forms again.
            </p>
            {data.secretFromEnv ? (
              <p className="hint">This secret is set by FORM_WEBHOOK_SECRET on the server.</p>
            ) : (
              <div>
                <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={rotate}>
                  Create a new secret
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useSite } from '../context/SiteContext.jsx';

const FORMS = [
  { key: 'join', title: 'Join INFORMS form', buttonKey: 'join' },
  { key: 'newsletter', title: 'Newsletter form', buttonKey: 'newsletter' },
];

function buildScript(secret) {
  return `// SCU INFORMS website connection: lets the board dashboard count this form's responses.
// It only shares submission times, never anyone's answers.
const SECRET = '${secret}';

function doGet(e) {
  if (!e || !e.parameter || e.parameter.secret !== SECRET) {
    return json_({ error: 'Invalid secret' });
  }
  const timestamps = FormApp.getActiveForm()
    .getResponses()
    .map((response) => response.getTimestamp().getTime());
  return json_({ timestamps: timestamps });
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
`;
}

const formatWhen = (ts) => (ts ? new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

function StatusBadge({ status }) {
  if (!status.url) return <span className="badge">Not connected</span>;
  if (status.error) return <span className="badge badge-warning">Connection problem</span>;
  if (status.connected) return <span className="badge badge-green">Connected</span>;
  return <span className="badge">Checking…</span>;
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

function FormCard({ form, status, onSave }) {
  const { content } = useSite();
  const [url, setUrl] = useState(status.url);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const formUrl = content.buttons[form.buttonKey]?.url;

  useEffect(() => setUrl(status.url), [status.url]);

  const save = async (next) => {
    setBusy(true);
    setError('');
    try {
      await onSave(form.key, next);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card forms-card">
      <div className="forms-card-head">
        <h2>{form.title}</h2>
        <StatusBadge status={status} />
      </div>

      {status.connected && (
        <p className="forms-meta">
          <strong>{status.totalResponses}</strong> response{status.totalResponses === 1 ? '' : 's'} so far
          {status.lastResponseAt && ` · latest ${formatWhen(status.lastResponseAt)}`}
          <span className="muted"> · checked {formatWhen(status.syncedAt)}</span>
        </p>
      )}
      {status.error && <p className="form-status error">{status.error}</p>}

      <form
        className="forms-url-row"
        onSubmit={(e) => {
          e.preventDefault();
          save(url.trim());
        }}
      >
        <label className="grow">
          Web app URL for this form
          <input
            type="url"
            value={url}
            placeholder="https://script.google.com/macros/s/…/exec"
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !url.trim() || url.trim() === status.url}>
          {busy ? 'Connecting…' : 'Connect'}
        </button>
        {status.url && (
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => save('')}>
            Disconnect
          </button>
        )}
      </form>
      {error && <p className="form-status error">{error}</p>}
      {formUrl && (
        <p className="hint">
          The website button currently opens{' '}
          <a href={formUrl} target="_blank" rel="noopener noreferrer">
            this form
          </a>
          . Make sure you add the script to that same form.
        </p>
      )}
    </section>
  );
}

export default function FormsConnection() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const run = useCallback(async (request) => {
    setRefreshing(true);
    try {
      setData(await request());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    run(() => api('/analytics/forms'));
  }, [run]);

  const saveUrl = async (form, url) => {
    setData(await api(`/analytics/forms/${form}`, { method: 'PUT', body: { url } }));
  };

  const rotate = () => {
    if (!window.confirm('Create a new secret? Both forms will stop syncing until you paste the new script and deploy a new version.')) return;
    run(() => api('/analytics/forms/rotate-secret', { method: 'POST' }));
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
            Connect each Google Form so Analytics can count how many people completed it. This works while the site runs on your own computer, too.
          </p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => run(() => api('/analytics/forms/sync', { method: 'POST' }))} disabled={refreshing}>
          {refreshing ? 'Checking…' : 'Check now'}
        </button>
      </div>

      {error && <p className="form-status error">{error}</p>}
      {!data && !error && <p className="muted">Loading…</p>}

      {data && (
        <>
          <section className="card forms-card">
            <h2>Add this script to each form</h2>
            <ol className="forms-steps">
              <li>
                Open the form in{' '}
                <a href="https://docs.google.com/forms/" target="_blank" rel="noopener noreferrer">
                  Google Forms
                </a>{' '}
                as an editor, then click the <strong>⋮</strong> menu (top right) → <strong>Apps Script</strong>.
              </li>
              <li>Delete everything in the editor, paste the script below, and click the save icon.</li>
              <li>
                Click <strong>Deploy → New deployment</strong>. Click the gear next to “Select type” and choose <strong>Web app</strong>. Set{' '}
                <strong>Execute as: Me</strong> and <strong>Who has access: Anyone</strong>, then click <strong>Deploy</strong> and approve the permissions
                (choose your account → Advanced → Go to project → Allow).
              </li>
              <li>
                Copy the <strong>Web app URL</strong> (it ends in <code>/exec</code>), paste it into that form’s box below, and click <strong>Connect</strong>.
              </li>
            </ol>
            <p className="hint">
              The same script works for both forms. “Anyone” is required so the site can read the response count, but the script only answers requests that
              include your secret, and it never shares anyone’s answers.
            </p>
            <div className="script-box">
              <div className="script-box-head">
                <span>Apps Script (same for both forms)</span>
                <CopyButton text={buildScript(data.secret)} />
              </div>
              <pre>
                <code>{buildScript(data.secret)}</code>
              </pre>
            </div>
          </section>

          {FORMS.map((form) => (
            <FormCard key={form.key} form={form} status={data.forms[form.key]} onSave={saveUrl} />
          ))}

          <div className="card field-card">
            <h3 className="field-label">Connection secret</h3>
            <p className="hint">
              The script contains a private secret so only this website can read the response counts. If it ever leaks, create a new one, then paste the new
              script into both forms and choose Deploy → Manage deployments → edit (pencil) → Version: New version → Deploy.
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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatDuration } from '../dates.js';
import { pageLabel } from '../siteConfig.js';

const RANGES = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 0, label: 'All time' },
];

const pct = (n) => `${(n * 100).toFixed(1)}%`;

function Kpi({ label, value, hint }) {
  return (
    <div className="kpi card">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {hint && <span className="kpi-hint">{hint}</span>}
    </div>
  );
}

function DailyChart({ daily }) {
  const max = Math.max(1, ...daily.map((d) => d.visitors));
  const labelEvery = Math.ceil(daily.length / 8);
  return (
    <div className="chart" role="img" aria-label="Daily unique visitors">
      <div className="chart-bars">
        {daily.map((d) => (
          <div key={d.date} className="chart-col" title={`${d.date}: ${d.visitors} visitors, ${d.pageviews} page views`}>
            <div className="chart-bar" style={{ height: `${(d.visitors / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="chart-axis">
        {daily.map((d, i) => (
          <span key={d.date}>{i % labelEvery === 0 ? new Date(`${d.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
        ))}
      </div>
      <span className="chart-max">{max}</span>
    </div>
  );
}

function Funnel({ title, color, visitors, data, completionLabel }) {
  const steps = [
    { label: 'Visitors', value: visitors, rate: null },
    { label: 'Clicked the button', value: data.uniqueClickers, rate: data.clickRate, rateLabel: 'of visitors' },
    { label: completionLabel, value: data.completions, rate: data.completionRate, rateLabel: 'of clickers' },
  ];
  const max = Math.max(1, visitors);
  return (
    <div className={`card funnel funnel-${color}`}>
      <h3>{title}</h3>
      <div className="funnel-rates">
        <div>
          <span className="kpi-value">{pct(data.clickRate)}</span>
          <span className="kpi-label">Click-through rate</span>
        </div>
        <div>
          <span className="kpi-value">{pct(data.completionRate)}</span>
          <span className="kpi-label">Form completion rate</span>
        </div>
      </div>
      <ul className="funnel-steps">
        {steps.map((s) => (
          <li key={s.label}>
            <div className="funnel-row">
              <span>{s.label}</span>
              <span>
                <strong>{s.value}</strong>
                {s.rate !== null && <span className="muted"> · {pct(s.rate)} {s.rateLabel}</span>}
              </span>
            </div>
            <div className="funnel-track">
              <div className="funnel-fill" style={{ width: `${Math.min(100, (s.value / max) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="hint">{data.clicks} total clicks (including repeat clicks).</p>
    </div>
  );
}

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    api(`/analytics/summary?days=${days}&tz=${new Date().getTimezoneOffset()}`)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div className="board-page container">
      <div className="board-page-head">
        <div>
          <h1>Analytics</h1>
          <p className="muted">Visits from logged-in board members are not counted.</p>
        </div>
        <div className="pill-tabs" role="tablist" aria-label="Date range">
          {RANGES.map((r) => (
            <button key={r.days} type="button" role="tab" aria-selected={days === r.days} className={`pill${days === r.days ? ' active' : ''}`} onClick={() => setDays(r.days)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="form-status error">{error}</p>}
      {!data && !error && <p className="muted">Loading analytics…</p>}

      {data && (
        <>
          <h2 className="board-section-title">Engagement</h2>
          <div className="kpi-grid">
            <Kpi label="Unique visitors" value={data.totals.visitors.toLocaleString()} />
            <Kpi label="Visits" value={data.totals.sessions.toLocaleString()} hint="Browsing sessions" />
            <Kpi label="Page views" value={data.totals.pageviews.toLocaleString()} />
            <Kpi label="Avg. engagement time" value={formatDuration(data.totals.avgEngagementPerVisit)} hint="Active time per visit" />
          </div>

          <div className="card chart-card">
            <h3>Unique visitors per day</h3>
            <DailyChart daily={data.daily} />
          </div>

          <h2 className="board-section-title">Engagement by page</h2>
          <div className="card table-card">
            {data.pages.length === 0 ? (
              <p className="muted">No page views in this period yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Page</th>
                    <th scope="col">Views</th>
                    <th scope="col">Visitors</th>
                    <th scope="col">Avg. engagement time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pages.map((p) => (
                    <tr key={p.path}>
                      <td>
                        {pageLabel(p.path)} <span className="muted">{p.path}</span>
                      </td>
                      <td>{p.views.toLocaleString()}</td>
                      <td>{p.visitors.toLocaleString()}</td>
                      <td>{formatDuration(p.avgSeconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="board-section-row">
            <h2 className="board-section-title">Conversion rate</h2>
            <Link to="/board/forms" className="btn btn-ghost btn-sm">
              Google Forms connection
            </Link>
          </div>
          <div className="two-col">
            <Funnel
              title="Join INFORMS"
              color="blue"
              visitors={data.totals.visitors}
              data={data.conversions.join}
              completionLabel="Completed the Google Form"
            />
            <Funnel
              title="Newsletter signups"
              color="green"
              visitors={data.totals.visitors}
              data={data.conversions.newsletter}
              completionLabel="Completed the signup form"
            />
          </div>

          {(!data.formsConnected?.join || !data.formsConnected?.newsletter) && (
            <div className="card notice-card">
              <h3>
                {!data.formsConnected?.join && !data.formsConnected?.newsletter
                  ? 'Your Google Forms aren’t connected yet'
                  : `The ${data.formsConnected?.join ? 'Newsletter' : 'Join INFORMS'} form isn’t connected yet`}
              </h3>
              <p>Form completions show up here once each Google Form is connected to the site. It takes about two minutes per form and works on localhost too.</p>
              <Link to="/board/forms" className="btn btn-primary btn-sm">
                Connect Google Forms
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

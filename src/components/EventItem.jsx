import { useId, useState } from 'react';
import { fmtDate, fmtTimeRange } from '../dates.js';
import { ChevronIcon, PinIcon } from './icons.jsx';

export default function EventItem({ event, past = false }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const start = new Date(event.start);
  const end = new Date(event.end);

  return (
    <li className={`event-item${open ? ' open' : ''}${past ? ' past' : ''}`}>
      <button type="button" className="event-summary" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        <span className="event-main">
          <span className="event-name">{event.name}</span>
          {event.location && (
            <span className="event-location">
              <PinIcon width={16} height={16} />
              {event.location}
            </span>
          )}
        </span>
        <span className="event-when">
          <span className="event-date">{fmtDate(start)}</span>
          <span className="event-time">{fmtTimeRange(start, end)}</span>
        </span>
        <ChevronIcon className="event-chevron" />
      </button>
      <div id={panelId} className="event-details" hidden={!open}>
        {event.details ? <p>{event.details}</p> : <p className="muted">More details coming soon.</p>}
      </div>
    </li>
  );
}

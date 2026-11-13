import { useEffect, useMemo, useState } from 'react';
import { dayKey, fmtDate, fmtTimeRange, isSameDay } from '../dates.js';
import { CloseIcon, PinIcon } from './icons.jsx';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildWeeks(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(1 - first.getDay());
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((first.getDay() + daysInMonth) / 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + d);
      return date;
    }),
  );
}

function eventsByDay(events) {
  const map = new Map();
  for (const event of events) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    let guard = 0;
    while (cursor <= end && guard++ < 31) {
      const key = dayKey(cursor);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  for (const list of map.values()) list.sort((a, b) => new Date(a.start) - new Date(b.start));
  return map;
}

export default function EventCalendar({ events, now }) {
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selected, setSelected] = useState(null);

  const weeks = useMemo(() => buildWeeks(month), [month]);
  const byDay = useMemo(() => eventsByDay(events), [events]);

  useEffect(() => {
    if (!selected) return;
    const onClick = (e) => {
      if (!e.target.closest('.cal-popover') && !e.target.closest('.cal-event')) setSelected(null);
    };
    const onKey = (e) => e.key === 'Escape' && setSelected(null);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [selected]);

  const shiftMonth = (delta) => {
    setSelected(null);
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  };

  return (
    <div className="calendar">
      <div className="cal-toolbar">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          ‹
        </button>
        <h3 className="cal-title" aria-live="polite">
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h3>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => shiftMonth(1)} aria-label="Next month">
          ›
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm cal-today"
          onClick={() => {
            setSelected(null);
            setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
          }}
        >
          Today
        </button>
      </div>

      <div className="cal-grid" role="grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="cal-weekday" role="columnheader">
            {d}
          </div>
        ))}
        {weeks.flat().map((date, index) => {
          const key = dayKey(date);
          const dayEvents = byDay.get(key) || [];
          const outside = date.getMonth() !== month.getMonth();
          const alignRight = index % 7 >= 4;
          return (
            <div
              key={key}
              role="gridcell"
              className={`cal-day${outside ? ' outside' : ''}${isSameDay(date, now) ? ' today' : ''}`}
            >
              <span className="cal-date">{date.getDate()}</span>
              {dayEvents.map((event) => {
                const isOpen = selected?.eventId === event.id && selected?.day === key;
                const isPast = new Date(event.end) <= now;
                return (
                  <div key={event.id} className="cal-event-wrap">
                    <button
                      type="button"
                      className={`cal-event${isPast ? ' past' : ''}${isOpen ? ' active' : ''}`}
                      onClick={() => setSelected(isOpen ? null : { eventId: event.id, day: key })}
                      title={event.name}
                    >
                      {event.name}
                    </button>
                    {isOpen && (
                      <div className={`cal-popover${alignRight ? ' align-right' : ''}`} role="dialog" aria-label={event.name}>
                        <button type="button" className="cal-popover-close" aria-label="Close" onClick={() => setSelected(null)}>
                          <CloseIcon width={16} height={16} />
                        </button>
                        <h4>{event.name}</h4>
                        <p className="cal-popover-when">
                          {fmtDate(new Date(event.start))}
                          <br />
                          {fmtTimeRange(new Date(event.start), new Date(event.end))}
                        </p>
                        {event.location && (
                          <p className="cal-popover-where">
                            <PinIcon width={14} height={14} /> {event.location}
                          </p>
                        )}
                        {event.details && <p className="cal-popover-details">{event.details}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

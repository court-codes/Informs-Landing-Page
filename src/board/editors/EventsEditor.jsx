import { newId } from '../../api.js';
import { fromLocalInput, toLocalInput } from '../../dates.js';
import { removeItem, updateItem } from '../listUtils.js';

export default function EventsEditor({ draft, update }) {
  const events = draft.events;
  const setEvents = (next) => update(['events'], next);
  const now = new Date();

  const addEvent = () => setEvents([{ id: newId(), name: '', location: '', start: '', end: '', details: '' }, ...events]);

  return (
    <div className="editor-panel">
      <div className="editor-head">
        <div>
          <h2>Events</h2>
          <p className="muted">
            Events appear under Upcoming Events and on the calendar, and move to Past Events automatically once their end time has passed.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={addEvent}>
          + Add event
        </button>
      </div>

      {events.length === 0 && <p className="empty-state">No events yet. Click “Add event” to create one.</p>}

      {events.map((event, index) => {
        const start = event.start ? new Date(event.start) : null;
        const end = event.end ? new Date(event.end) : null;
        const invalidRange = start && end && end <= start;
        const incomplete = !event.name || !start || !end;
        const status = incomplete ? 'Draft — hidden until name, start and end are filled in' : end <= now ? 'Past' : 'Upcoming';
        return (
          <fieldset key={event.id} className="card field-card">
            <legend>
              {event.name || 'New event'} <span className={`badge${status === 'Upcoming' ? ' badge-green' : ''}`}>{status}</span>
            </legend>
            <div className="field-row">
              <label className="grow">
                Event name
                <input type="text" value={event.name} onChange={(e) => setEvents(updateItem(events, index, { name: e.target.value }))} />
              </label>
              <label className="grow">
                Location
                <input type="text" value={event.location} onChange={(e) => setEvents(updateItem(events, index, { location: e.target.value }))} />
              </label>
            </div>
            <div className="field-row">
              <label>
                Starts
                <input
                  type="datetime-local"
                  value={toLocalInput(event.start)}
                  onChange={(e) => {
                    const startIso = fromLocalInput(e.target.value);
                    const patch = { start: startIso };
                    if (startIso && !event.end) patch.end = new Date(new Date(startIso).getTime() + 60 * 60 * 1000).toISOString();
                    setEvents(updateItem(events, index, patch));
                  }}
                />
              </label>
              <label>
                Ends
                <input
                  type="datetime-local"
                  value={toLocalInput(event.end)}
                  onChange={(e) => setEvents(updateItem(events, index, { end: fromLocalInput(e.target.value) }))}
                />
              </label>
            </div>
            {invalidRange && <p className="form-status warning">The end time should be after the start time.</p>}
            <label>
              Details (shown in the dropdown and calendar popup)
              <textarea rows={3} value={event.details} onChange={(e) => setEvents(updateItem(events, index, { details: e.target.value }))} />
            </label>
            <div className="field-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm danger-text"
                onClick={() => window.confirm('Delete this event? This takes effect when you save.') && setEvents(removeItem(events, index))}
              >
                Delete event
              </button>
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

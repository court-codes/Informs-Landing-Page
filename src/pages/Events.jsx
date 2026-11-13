import { useEffect, useMemo, useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';
import RichText from '../components/RichText.jsx';
import EventItem from '../components/EventItem.jsx';
import EventCalendar from '../components/EventCalendar.jsx';
import SocialLinks from '../components/SocialLinks.jsx';

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export default function Events() {
  const { content } = useSite();
  const now = useNow();
  const [pastOrder, setPastOrder] = useState('newest');

  const events = useMemo(
    () =>
      content.events.filter(
        (e) => e.name && e.start && e.end && !Number.isNaN(new Date(e.start).getTime()) && !Number.isNaN(new Date(e.end).getTime()),
      ),
    [content.events],
  );

  const upcoming = events
    .filter((e) => new Date(e.end) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  const past = events
    .filter((e) => new Date(e.end) <= now)
    .sort((a, b) => (pastOrder === 'newest' ? new Date(b.start) - new Date(a.start) : new Date(a.start) - new Date(b.start)));

  return (
    <>
      <section className="section page-section">
        <div className="container">
          <RichText html={content.text.events.intro} className="page-text centered" />

          <h2 className="section-title">Upcoming Events</h2>
          {upcoming.length === 0 ? (
            <div className="empty-state">
              <p>No upcoming events right now. Check back soon or follow us for announcements.</p>
              <SocialLinks variant="buttons" />
            </div>
          ) : (
            <ul className="event-list">
              {upcoming.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="section section-tint">
        <div className="container">
          <h2 className="section-title">Calendar</h2>
          <EventCalendar events={events} now={now} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-title-row">
            <h2 className="section-title">Past Events</h2>
            {past.length > 1 && (
              <label className="sort-control">
                Sort by date
                <select value={pastOrder} onChange={(e) => setPastOrder(e.target.value)}>
                  <option value="newest">Newest to oldest</option>
                  <option value="oldest">Oldest to newest</option>
                </select>
              </label>
            )}
          </div>
          {past.length === 0 ? (
            <p className="empty-state">Past events will appear here.</p>
          ) : (
            <ul className="event-list">
              {past.map((event) => (
                <EventItem key={event.id} event={event} past />
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

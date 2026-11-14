import { useState } from 'react';
import { useSite } from '../context/SiteContext.jsx';
import { api } from '../api.js';
import { STATIC_SITE } from '../staticSite.js';
import RichText from '../components/RichText.jsx';
import SocialLinks from '../components/SocialLinks.jsx';
import { MailIcon } from '../components/icons.jsx';

const EMPTY = { name: '', email: '', subject: '', message: '' };

export default function Contact() {
  const { content } = useSite();
  const to = content.links.contactEmail || 'informs@scu.edu';
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'sending', message: '' });
    try {
      const { delivered } = STATIC_SITE ? { delivered: false } : await api('/contact', { method: 'POST', body: form });
      if (delivered) {
        setForm(EMPTY);
        setStatus({ state: 'sent', message: 'Thanks for reaching out! The board will get back to you soon.' });
        return;
      }
      const body = `${form.message}\n\n— ${form.name} (${form.email})`;
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`;
      setStatus({
        state: 'sent',
        message: `Your email app should open with your message to ${to}. Just press send there to finish.`,
      });
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  };

  return (
    <section className="section page-section">
      <div className="container contact-layout">
        <div className="contact-info">
          <RichText html={content.text.contact.intro} className="page-text" />
          <a className="contact-email" href={`mailto:${to}`}>
            <MailIcon /> {to}
          </a>
          <h2 className="contact-follow">Follow us</h2>
          <SocialLinks variant="buttons" />
        </div>

        <form className="card contact-form" onSubmit={onSubmit}>
          <h2>Send us an email</h2>
          <label>
            Name
            <input type="text" value={form.name} onChange={update('name')} required maxLength={120} autoComplete="name" />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={update('email')} required maxLength={200} autoComplete="email" />
          </label>
          <label>
            Subject
            <input type="text" value={form.subject} onChange={update('subject')} required maxLength={200} />
          </label>
          <label>
            Message
            <textarea rows={6} value={form.message} onChange={update('message')} required maxLength={5000} />
          </label>
          <button type="submit" className="btn btn-primary" disabled={status.state === 'sending'}>
            {status.state === 'sending' ? 'Sending…' : 'Submit'}
          </button>
          {status.message && (
            <p className={`form-status ${status.state === 'error' ? 'error' : 'success'}`} role="status">
              {status.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

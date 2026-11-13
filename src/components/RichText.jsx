import { useMemo } from 'react';
import DOMPurify from 'dompurify';

export default function RichText({ html, className = '' }) {
  const clean = useMemo(() => DOMPurify.sanitize(html || ''), [html]);
  if (!clean) return null;
  return <div className={`rich-text ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}

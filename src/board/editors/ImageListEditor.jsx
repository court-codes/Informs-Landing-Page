import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { newId, uploadImage } from '../../api.js';
import ItemControls from '../ItemControls.jsx';
import { moveItem, removeItem, updateItem } from '../listUtils.js';

export default function ImageListEditor({ title, description, items, onChange, viewPath }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onFiles = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    setError('');
    const added = [];
    for (const file of files) {
      try {
        added.push({ id: newId(), url: await uploadImage(file), caption: '' });
      } catch (err) {
        setError(`${file.name}: ${err.message}`);
      }
    }
    onChange([...items, ...added]);
    setBusy(false);
  };

  return (
    <div className="editor-panel">
      <div className="editor-head">
        <div>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
        </div>
        <div className="editor-head-actions">
          {viewPath && (
            <Link to={viewPath} className="btn btn-ghost btn-sm">
              View page ↗
            </Link>
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? 'Uploading…' : '+ Upload photos'}
          </button>
          <input ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={onFiles} />
        </div>
      </div>
      {error && <p className="form-status error">{error}</p>}

      {items.length === 0 ? (
        <p className="empty-state">No photos yet. Upload one or more images to get started.</p>
      ) : (
        <div className="image-list">
          {items.map((item, index) => (
            <div key={item.id} className="card image-list-item">
              <img src={item.url} alt={item.caption || ''} />
              <input
                type="text"
                placeholder="Caption (optional)"
                value={item.caption}
                onChange={(e) => onChange(updateItem(items, index, { caption: e.target.value }))}
              />
              <ItemControls
                index={index}
                count={items.length}
                vertical={false}
                onMove={(i, d) => onChange(moveItem(items, i, d))}
                onRemove={(i) => onChange(removeItem(items, i))}
                removeLabel="Remove photo"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

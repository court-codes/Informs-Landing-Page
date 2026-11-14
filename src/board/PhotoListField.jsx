import { useRef, useState } from 'react';
import { newId, uploadImage } from '../api.js';
import ItemControls from './ItemControls.jsx';
import { moveItem, removeItem } from './listUtils.js';

export default function PhotoListField({ photos, onChange }) {
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
        added.push({ id: newId(), url: await uploadImage(file) });
      } catch (err) {
        setError(`${file.name}: ${err.message}`);
      }
    }
    onChange([...photos, ...added]);
    setBusy(false);
  };

  return (
    <div className="photo-field">
      <div className="photo-field-grid">
        {photos.map((photo, index) => (
          <div key={photo.id} className="photo-field-item">
            <img src={photo.url} alt={`Photo ${index + 1}`} />
            {index === 0 && <span className="photo-field-badge">Thumbnail</span>}
            <ItemControls
              index={index}
              count={photos.length}
              vertical={false}
              onMove={(i, d) => onChange(moveItem(photos, i, d))}
              onRemove={(i) => onChange(removeItem(photos, i))}
              removeLabel="Remove photo"
            />
          </div>
        ))}
        <button type="button" className="photo-field-add" onClick={() => inputRef.current?.click()} disabled={busy}>
          <span aria-hidden="true">+</span>
          {busy ? 'Uploading…' : photos.length ? 'Add more photos' : 'Upload photos'}
        </button>
      </div>
      <input ref={inputRef} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={onFiles} />
      <p className="hint">You can select several photos at once. The first photo is the post’s thumbnail; use the arrows to reorder.</p>
      {error && <p className="form-status error">{error}</p>}
    </div>
  );
}

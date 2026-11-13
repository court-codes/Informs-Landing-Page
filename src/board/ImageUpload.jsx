import { useRef, useState } from 'react';
import { uploadImage } from '../api.js';

export default function ImageUpload({ value, onChange, label = 'Image', shape = 'wide' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`image-upload shape-${shape}`}>
      <div className="image-preview">{value ? <img src={value} alt={label} /> : <span>No image</span>}</div>
      <div className="image-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
        </button>
        {value && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange('')}>
            Remove
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={onFile} />
      </div>
      {error && <p className="form-status error">{error}</p>}
    </div>
  );
}

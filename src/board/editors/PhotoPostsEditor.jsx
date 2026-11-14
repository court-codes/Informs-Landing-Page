import { useState } from 'react';
import { Link } from 'react-router-dom';
import { newId } from '../../api.js';
import { dayKey } from '../../dates.js';
import PhotoListField from '../PhotoListField.jsx';
import { removeItem, updateItem } from '../listUtils.js';

export default function PhotoPostsEditor({ draft, update, contentKey, toPosts, heading, description, addLabel, emptyText, viewPath }) {
  const posts = toPosts(draft[contentKey]);
  const setPosts = (next) => update([contentKey], next);
  const [openId, setOpenId] = useState(null);

  const addPost = () => {
    const post = { id: newId(), title: '', date: dayKey(new Date()), caption: '', photos: [] };
    setPosts([post, ...posts]);
    setOpenId(post.id);
  };

  return (
    <div className="editor-panel">
      <div className="editor-head">
        <div>
          <h2>{heading}</h2>
          <p className="muted">{description}</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={addPost}>
          {addLabel}
        </button>
      </div>

      {posts.length === 0 && <p className="empty-state">{emptyText}</p>}

      {posts.map((post, index) => {
        const open = openId === post.id;
        const set = (patch) => setPosts(updateItem(posts, index, patch));
        return (
          <div key={post.id} className={`card collapsible${open ? ' open' : ''}`}>
            <button type="button" className="collapsible-head" aria-expanded={open} onClick={() => setOpenId(open ? null : post.id)}>
              <span className="collapsible-title">
                {post.photos[0] ? <img src={post.photos[0].url} alt="" className="collapsible-thumb" /> : <span className="collapsible-thumb" />}
                <span>
                  <strong>{post.title || 'Untitled post'}</strong>
                  <span className="muted">
                    {' '}
                    · {post.photos.length} photo{post.photos.length === 1 ? '' : 's'} · {post.date || 'No date'}
                  </span>
                </span>
              </span>
              <span aria-hidden="true">{open ? '−' : '+'}</span>
            </button>
            {open && (
              <div className="collapsible-body">
                <div className="field-row">
                  <label className="grow">
                    Title
                    <input type="text" value={post.title} onChange={(e) => set({ title: e.target.value })} />
                  </label>
                  <label>
                    Date
                    <input type="date" value={post.date} onChange={(e) => set({ date: e.target.value })} />
                  </label>
                </div>
                <label>
                  Caption
                  <textarea rows={3} value={post.caption} onChange={(e) => set({ caption: e.target.value })} />
                </label>
                <div className="field-block">
                  <span className="field-label">Photos</span>
                  <PhotoListField photos={post.photos} onChange={(photos) => set({ photos })} />
                </div>
                <div className="field-actions">
                  {(post.title || post.photos.length > 0) && (
                    <Link to={viewPath(post)} className="btn btn-ghost btn-sm">
                      View post ↗
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm danger-text"
                    onClick={() => window.confirm('Delete this post? This takes effect when you save.') && setPosts(removeItem(posts, index))}
                  >
                    Delete post
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

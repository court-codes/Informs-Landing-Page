import { useState } from 'react';
import { Link } from 'react-router-dom';
import { newId } from '../../api.js';
import { dayKey } from '../../dates.js';
import ImageUpload from '../ImageUpload.jsx';
import RichTextEditor from '../RichTextEditor.jsx';
import { removeItem, updateItem } from '../listUtils.js';

export default function BlogEditor({ draft, update, version }) {
  const posts = draft.blog;
  const setPosts = (next) => update(['blog'], next);
  const [openId, setOpenId] = useState(null);

  const addPost = () => {
    const post = { id: newId(), title: '', date: dayKey(new Date()), author: '', cover: '', excerpt: '', body: '' };
    setPosts([post, ...posts]);
    setOpenId(post.id);
  };

  return (
    <div className="editor-panel">
      <div className="editor-head">
        <div>
          <h2>Blog</h2>
          <p className="muted">Posts are shown newest first. Posts without a title stay hidden.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={addPost}>
          + New post
        </button>
      </div>

      {posts.length === 0 && <p className="empty-state">No posts yet. Click “New post” to write one.</p>}

      {posts.map((post, index) => {
        const open = openId === post.id;
        const set = (patch) => setPosts(updateItem(posts, index, patch));
        return (
          <div key={post.id} className={`card collapsible${open ? ' open' : ''}`}>
            <button type="button" className="collapsible-head" aria-expanded={open} onClick={() => setOpenId(open ? null : post.id)}>
              <span>
                <strong>{post.title || 'Untitled post'}</strong>
                <span className="muted"> · {post.date || 'No date'}</span>
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
                  <label>
                    Author
                    <input type="text" value={post.author} onChange={(e) => set({ author: e.target.value })} />
                  </label>
                </div>
                <div className="field-block">
                  <span className="field-label">Cover image</span>
                  <ImageUpload label="Cover image" value={post.cover} onChange={(url) => set({ cover: url })} />
                </div>
                <label>
                  Short summary (shown on the blog card)
                  <textarea rows={2} value={post.excerpt} onChange={(e) => set({ excerpt: e.target.value })} />
                </label>
                <div className="field-block">
                  <span className="field-label">Post content</span>
                  <RichTextEditor key={`${version}-${post.id}`} label="Post content" value={post.body} onChange={(html) => set({ body: html })} />
                </div>
                <div className="field-actions">
                  {post.title && (
                    <Link to={`/explore/blog/${post.id}`} className="btn btn-ghost btn-sm">
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

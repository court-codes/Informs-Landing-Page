import { useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSite } from '../context/SiteContext.jsx';
import { editorTargetFor } from '../siteConfig.js';

const LAST_PUBLIC_PATH = 'informs_last_public_path';

export default function BoardBar() {
  const { auth, logout } = useSite();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const inBoard = pathname.startsWith('/board') && pathname !== '/board/login';

  useEffect(() => {
    if (!pathname.startsWith('/board')) sessionStorage.setItem(LAST_PUBLIC_PATH, pathname);
  }, [pathname]);

  if (!auth.authenticated) return null;

  const lastPublic = sessionStorage.getItem(LAST_PUBLIC_PATH);
  const audiencePath = lastPublic && !lastPublic.startsWith('/board') ? lastPublic : '/';

  return (
    <div className="board-bar">
      <div className="board-bar-inner">
        <span className="board-bar-title">SCU INFORMS Board</span>
        <nav className="board-tabs" aria-label="Board">
          <NavLink
            to="/board/analytics"
            className={({ isActive }) => `board-tab${isActive || pathname === '/board/forms' ? ' active' : ''}`}
          >
            Analytics
          </NavLink>
          <NavLink to="/board/edit" className="board-tab">
            Edit Content
          </NavLink>
          <Link to={audiencePath} className={`board-tab${inBoard ? '' : ' active'}`}>
            Audience View
          </Link>
        </nav>
        <div className="board-bar-actions">
          {!inBoard && (
            <Link to={editorTargetFor(pathname)} className="board-edit-page">
              Edit this page
            </Link>
          )}
          <span className="board-email">{auth.email}</span>
          <button
            type="button"
            className="board-logout"
            onClick={async () => {
              await logout();
              navigate('/board/login');
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

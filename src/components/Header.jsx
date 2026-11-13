import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { NAV } from '../siteConfig.js';
import { useSite } from '../context/SiteContext.jsx';
import { HeaderLogo } from './Logos.jsx';
import { ChevronIcon, CloseIcon, MenuIcon } from './icons.jsx';

function DropdownItem({ item, open, onToggle }) {
  const { pathname } = useLocation();
  const active = pathname.startsWith(item.to);
  return (
    <li className={`nav-item has-dropdown${open ? ' open' : ''}`}>
      <button
        type="button"
        className={`nav-link${active ? ' active' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={onToggle}
      >
        {item.label}
        <ChevronIcon className="nav-caret" width={16} height={16} />
      </button>
      <ul className="dropdown">
        {item.children.map((child) => (
          <li key={child.to}>
            <NavLink to={child.to} className="dropdown-link">
              {child.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default function Header() {
  const { auth } = useSite();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenDropdown(null);
    };
    const onKey = (e) => e.key === 'Escape' && setOpenDropdown(null);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="container header-inner" ref={navRef}>
        <Link to="/" className="header-logo" aria-label="SCU INFORMS home">
          <HeaderLogo />
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <nav className={`main-nav${mobileOpen ? ' mobile-open' : ''}`} aria-label="Main">
          <ul className="nav-list">
            {NAV.map((item) =>
              item.children ? (
                <DropdownItem
                  key={item.to}
                  item={item}
                  open={openDropdown === item.to}
                  onToggle={() => setOpenDropdown((cur) => (cur === item.to ? null : item.to))}
                />
              ) : (
                <li key={item.to} className="nav-item">
                  <NavLink to={item.to} end className="nav-link">
                    {item.label}
                  </NavLink>
                </li>
              ),
            )}
            <li className="nav-item">
              <NavLink to={auth.authenticated ? '/board/edit' : '/board/login'} className="btn btn-outline btn-sm nav-board">
                {auth.authenticated ? 'Board Dashboard' : 'Board Login'}
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

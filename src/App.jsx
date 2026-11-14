import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useSite } from './context/SiteContext.jsx';
import { setTrackingEnabled, trackPageview } from './tracking.js';
import { pageLabel } from './siteConfig.js';
import { STATIC_SITE } from './staticSite.js';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import BoardBar from './components/BoardBar.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Home from './pages/Home.jsx';
import Chapter from './pages/Chapter.jsx';
import Team from './pages/Team.jsx';
import JoinTeam from './pages/JoinTeam.jsx';
import Events from './pages/Events.jsx';
import Blog from './pages/Blog.jsx';
import BlogPost from './pages/BlogPost.jsx';
import Gallery from './pages/Gallery.jsx';
import Contact from './pages/Contact.jsx';
import BoardLogin from './pages/BoardLogin.jsx';
import NotFound from './pages/NotFound.jsx';

const Analytics = lazy(() => import('./board/Analytics.jsx'));
const EditContent = lazy(() => import('./board/EditContent.jsx'));
const FormsConnection = lazy(() => import('./board/FormsConnection.jsx'));

function RouteEffects() {
  const { pathname } = useLocation();
  const { auth } = useSite();

  useEffect(() => {
    window.scrollTo(0, 0);
    const label = pageLabel(pathname);
    document.title = label === 'Home' ? 'SCU INFORMS' : `${label} | SCU INFORMS`;
  }, [pathname]);

  useEffect(() => {
    if (auth.loading) return;
    setTrackingEnabled(!STATIC_SITE && !auth.authenticated && !pathname.startsWith('/board'));
    trackPageview(pathname);
  }, [pathname, auth.loading, auth.authenticated]);

  return null;
}

function PublicLayout() {
  return (
    <div className="site">
      <Header />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function RequireBoard() {
  const { auth } = useSite();
  const { pathname } = useLocation();
  if (auth.loading) return <div className="page-loading">Loading…</div>;
  if (!auth.authenticated) return <Navigate to="/board/login" replace />;
  return (
    <main className="board-main">
      <ErrorBoundary key={pathname}>
        <Suspense fallback={<div className="page-loading">Loading…</div>}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}

export default function App() {
  const { content, loadError } = useSite();

  if (loadError) {
    return (
      <div className="page-loading">
        <p>We couldn’t load the site right now. Please refresh in a moment.</p>
      </div>
    );
  }
  if (!content) return <div className="page-loading">Loading…</div>;

  return (
    <>
      <RouteEffects />
      <BoardBar />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<Navigate to="/about/chapter" replace />} />
          <Route path="about/chapter" element={<Chapter />} />
          <Route path="about/team" element={<Team />} />
          <Route path="about/join" element={<JoinTeam />} />
          <Route path="events" element={<Events />} />
          <Route path="explore" element={<Navigate to="/explore/blog" replace />} />
          <Route path="explore/blog" element={<Blog />} />
          <Route path="explore/blog/:postId" element={<BlogPost />} />
          <Route path="explore/gallery" element={<Gallery />} />
          <Route path="contact" element={<Contact />} />
          <Route path="board/login" element={<BoardLogin />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="board" element={<RequireBoard />}>
          <Route index element={<Navigate to="/board/edit" replace />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="forms" element={<FormsConnection />} />
          <Route path="edit" element={<EditContent />} />
        </Route>
      </Routes>
    </>
  );
}

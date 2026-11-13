import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section page-section">
      <div className="container narrow centered">
        <h1>Page not found</h1>
        <p>The page you’re looking for doesn’t exist.</p>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="container section empty-page">
      <span className="tag">404</span>

      <h1 className="heading">
        This story could not be found.
      </h1>

      <p className="muted">
        The page may have moved, or the heritage story you are looking
        for may no longer be available.
      </p>

      <div className="filters">
        <Link to="/" className="btn primary">
          Return Home
        </Link>

        <Link to="/search" className="btn outline">
          Search Moji's Heritage
        </Link>
      </div>
    </section>
  );
}
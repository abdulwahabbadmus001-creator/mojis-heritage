import { Link } from "react-router-dom";
import { cultures } from "../../data/cultures";

export default function CultureExplorer() {
  return (
    <section className="container section">
      <div className="section-heading">
        <div>
          <span className="tag">People & Culture</span>
          <h2 className="heading">Explore by Culture</h2>
          <p className="muted">
            Discover histories, languages, festivals, foods, people and
            traditions through Nigeria's diverse communities.
          </p>
        </div>

        <Link to="/cultures" className="btn outline">
          View all cultures
        </Link>
      </div>

      <div className="grid cards">
        {cultures.slice(0, 6).map((culture) => (
          <Link
            to={`/cultures/${culture.slug}`}
            className="card card-body"
            key={culture.slug}
          >
            <span className="tag">{culture.regions[0]}</span>
            <h3 className="heading">{culture.name}</h3>
            <p className="muted">{culture.description}</p>
            <strong>Explore {culture.name} →</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
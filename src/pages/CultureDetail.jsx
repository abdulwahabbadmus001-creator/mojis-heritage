import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cultures } from "../data/cultures";
import { getPosts } from "../services/content";

export default function CultureDetail() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);

  const culture = cultures.find((item) => item.slug === slug);

  useEffect(() => {
    getPosts().then(setPosts);
  }, []);

  if (!culture) {
    return (
      <section className="container section">
        <h1 className="heading">Culture not found</h1>
        <Link to="/cultures">Explore cultures</Link>
      </section>
    );
  }

  const related = posts.filter(
    (post) =>
      post.ethnicGroup?.toLowerCase() === culture.name.toLowerCase()
  );

  const categories = [
    ["heritage", "Cultural Heritage"],
    ["histories", "History"],
    ["festivals", "Festivals"],
    ["foods", "Traditional Foods"],
    ["languages", "Language"],
    ["heroes", "Heroes & Heroines"]
  ];

  return (
    <section className="container section">
      <span className="tag">{culture.regions.join(" · ")}</span>

      <h1 className="heading">Explore {culture.name}</h1>

      <p className="muted">{culture.description}</p>

      <p>
        <strong>Associated states:</strong>{" "}
        {culture.states.join(", ")}
      </p>

      {categories.map(([key, label]) => {
        const items = related.filter((post) => post.category === key);

        if (!items.length) return null;

        return (
          <section className="section" key={key}>
            <h2 className="heading">{label}</h2>

            <div className="grid cards">
              {items.map((post) => (
                <Link
                  to={`/post/${post.id}`}
                  className="card card-body"
                  key={post.id}
                >
                  <h3 className="heading">{post.title}</h3>
                  <p className="muted">{post.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}
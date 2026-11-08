import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Link,
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./article-markdown.css";

import {
  Bookmark,
  CalendarDays,
  Clock,
  MapPin,
  Printer,
  Search
} from "lucide-react";

function YouTubeIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
  );
}

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer
} from "react-leaflet";

import {
  getPosts,
  getListings,
  bumpView,
  getSiteSettings
} from "../services/content";

import {
  categories,
  seedPosts
} from "../data/seed";

import {
  cultures,
  getCultureBySlug
} from "../data/cultures";

import {
  Share,
  EmptyState,
  PageLoading
} from "../components/Site";

import {
  readingTime
} from "../utils/readingTime";

import {
  useSavedPosts
} from "../hooks/useSavedPosts";

import {
  addRecentlyViewed,
  getRecentlyViewed
} from "../hooks/useRecentlyViewed";

import {
  useConsent,
  CONSENT_STORAGE_KEY,
  THEME_STORAGE_KEY,
  SAVED_POSTS_KEY,
  RECENTLY_VIEWED_KEY
} from "../context/Consent";

import {
  firebaseReady,
  db,
} from "../firebase";

import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp
} from "firebase/firestore";


/* ----------------------------------
   HELPERS
---------------------------------- */

const CATEGORY_LABELS = {
  heritage: "Cultural Heritage",
  festivals: "Festivals",
  documentaries: "Documentaries",
  histories: "Short Histories",
  heroes: "Heroes & Heroines",
  foods: "Traditional Foods",
  languages: "Languages",
  gallery: "Photo Gallery"
};

const CATEGORY_DESCRIPTIONS = {
  heritage:
    "Discover living traditions, institutions, crafts, ceremonies and cultural practices from communities across Nigeria.",

  festivals:
    "Explore festivals and celebrations that bring together history, spirituality, performance and community.",

  documentaries:
    "Continue learning through selected audiovisual stories and documentary resources.",

  histories:
    "Read accessible introductions to kingdoms, societies, cities, political institutions and important historical developments.",

  heroes:
    "Meet historical personalities whose lives continue to shape Nigerian cultural memory.",

  foods:
    "Discover foods, ingredients and culinary traditions while recognising the diversity of preparation across communities.",

  languages:
    "Explore Nigerian languages, expressions, literary traditions and their place in cultural identity."
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function normalise(value) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function PostCard({
  post,
  showCategory = false
}) {
  const {
    isSaved,
    toggleSaved
  } = useSavedPosts();

  const saved =
    isSaved(post.id);

  return (
    <article className="card post-card">
      <Link
        to={`/post/${post.id}`}
        className="post-image-link"
      >
        <img
          loading="lazy"
          src={post.coverImage}
          alt={post.title}
          className="post-card-image"
        />
      </Link>

      <div className="card-body">
        <div className="post-card-tags">
          {showCategory && (
            <span className="tag">
              {CATEGORY_LABELS[
                post.category
              ] || post.category}
            </span>
          )}

          {post.ethnicGroup && (
            <span className="tag soft">
              {post.ethnicGroup}
            </span>
          )}
        </div>

        <h3 className="heading post-card-title">
          <Link
            to={`/post/${post.id}`}
          >
            {post.title}
          </Link>
        </h3>

        <p className="muted">
          {post.summary}
        </p>

        <div className="post-card-meta">
          <span>
            <Clock size={15} />
            {readingTime(post.body)}
          </span>

          {post.region && (
            <span>
              <MapPin size={15} />
              {post.region}
            </span>
          )}
        </div>

        <div className="post-card-actions">
          <Link
            className="btn primary"
            to={`/post/${post.id}`}
          >
            Read story
          </Link>

          <button
            type="button"
            className={
              saved
                ? "icon-button saved"
                : "icon-button"
            }
            aria-label={
              saved
                ? "Remove from saved stories"
                : "Save story for later"
            }
            title={
              saved
                ? "Remove from saved stories"
                : "Save for later"
            }
            onClick={() =>
              toggleSaved(post.id)
            }
          >
            <Bookmark
              size={18}
              fill={
                saved
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>
      </div>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
  link,
  linkLabel
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && (
          <span className="eyebrow">
            {eyebrow}
          </span>
        )}

        <h2 className="heading">
          {title}
        </h2>

        {text && (
          <p className="muted">
            {text}
          </p>
        )}
      </div>

      {link && (
        <Link
          className="text-link"
          to={link}
        >
          {linkLabel || "Explore all"} →
        </Link>
      )}
    </div>
  );
}

/* ----------------------------------
   PROVENANCE TIMELINE CHAPTERS
   (Split-Screen Artifact Viewer Data)
---------------------------------- */

const HERITAGE_TIMELINE_CHAPTERS = [
  {
    id: "nok-terracotta",
    era: "c. 900 BCE – 200 CE • CENTRAL NIGERIA",
    periodLabel: "ERA I · ARCHAEOLOGICAL RECORD",
    title: "01. The Nok Terracotta & Early Iron Tradition",
    summary:
      "Archaeological excavations across central Nigeria (first identified near Nok village in Kaduna State in 1928) have uncovered large-scale coil-built terracotta sculptures alongside early iron-smelting furnaces dated between the first millennium BCE and second century CE.",
    material: "Coarse-grained Fired Clay & Iron Slag",
    provenanceContext: "Central Nigeria (Kaduna & Benue Valleys) · Ref: NCMM / Breunig (2014)",
    focalPoint: "center 24%",
    zoomScale: 1.0,
    detailCallout: "Illustrative Plate · Nok-era terracotta & ironworking scholarship",
    image:
      "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=1400&q=80",
    storyLink: "/histories"
  },
  {
    id: "igbo-ukwu",
    era: "9th – 10th CENTURY CE • ANAMBRA VALLEY",
    periodLabel: "ERA II · METALLURGICAL TRADITION",
    title: "02. Igbo-Ukwu Lost-Wax Bronzes",
    summary:
      "Excavated by archaeologist Thurstan Shaw (1959–1964) at Igbo Isaiah, Igbo Richard, and Igbo Jonah, the Igbo-Ukwu corpus demonstrates sophisticated leaded-bronze cire-perdue (lost-wax) casting and long-distance trade networks associated with the Eze Nri institution.",
    material: "Leaded Bronze, Copper & Glass Beads",
    provenanceContext: "Igbo-Ukwu, Anambra State · Ref: Shaw (1970) / NCMM Lagos",
    focalPoint: "center 45%",
    zoomScale: 1.18,
    detailCallout: "Illustrative Plate · Igbo-Ukwu bronze-casting & Nri ritual context",
    image:
      "https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=1400&q=80",
    storyLink: "/post/ozo"
  },
  {
    id: "ife-naturalism",
    era: "12th – 15th CENTURY CE • ILÉ-IFẸ̀",
    periodLabel: "ERA III · CLASSICAL NATURALISM",
    title: "03. Sacred Naturalism of Ancient Ilé-Ifẹ̀",
    summary:
      "In Yorùbá oral tradition and archaeological research at sites such as Wunmonije Compound and Ita Yemoo, medieval Ilé-Ifẹ̀ artists produced naturalistic copper-alloy and terracotta sculptures interpreted by scholars as royal and sacred effigies.",
    material: "Copper Alloy (Brass/Bronze) & Terracotta",
    provenanceContext: "Ilé-Ifẹ̀, Osun State · Ref: Ife Museum (NCMM) / Willett (1967)",
    focalPoint: "center 18%",
    zoomScale: 1.26,
    detailCallout: "Illustrative Plate · Classical Ilé-Ifẹ̀ portraiture & facial striations",
    image:
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1400&q=80",
    storyLink: "/cultures/yoruba"
  },
  {
    id: "benin-guilds",
    era: "15th – 19th CENTURY CE • EDO KINGDOM",
    periodLabel: "ERA IV · COURT HISTORIOGRAPHY",
    title: "04. Royal Guilds of the Benin Kingdom",
    summary:
      "Organized under the Oba in Benin City, hereditary guilds of brass-casters (Igun Eronmwon) and ivory carvers (Igbesanmwan) recorded dynastic history, palace rituals, and diplomacy prior to the 1897 British expedition and subsequent global restitution efforts.",
    material: "Cast Brass, Elephant Ivory & Coral Regalia",
    provenanceContext: "Benin City, Edo State · Ref: Benin National Museum / Digital Benin",
    focalPoint: "center 35%",
    zoomScale: 1.12,
    detailCallout: "Illustrative Plate · Benin court guild traditions & historical memory",
    image:
      "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1400&q=80",
    storyLink: "/post/benin"
  }
];

/* ----------------------------------
   HOME
---------------------------------- */

export function Home() {
  const [posts, setPosts] =
    useState([]);

  const [listings, setListings] =
    useState([]);

  const [recent, setRecent] =
    useState([]);

  const [searchValue, setSearchValue] =
    useState("");

  const [lightingMode, setLightingMode] =
    useState("raking");

  const [hotspotOpen, setHotspotOpen] =
    useState(false);

  const [activeChapterId, setActiveChapterId] =
    useState(HERITAGE_TIMELINE_CHAPTERS[0].id);

  const [artifactZoom, setArtifactZoom] =
    useState(1);

  const { choices } = useConsent();

  const navigate = useNavigate();

  const channel =
    import.meta.env
      .VITE_YOUTUBE_CHANNEL_URL ||
    "https://www.youtube.com";

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch(() => setPosts([]));

    getListings()
      .then(setListings)
      .catch(() => setListings([]));
  }, []);

  useEffect(() => {
    setRecent(
      getRecentlyViewed()
    );
  }, [choices.preferences]);

  function submitSearch(event) {
    event.preventDefault();

    const value =
      searchValue.trim();

    if (!value) {
      return;
    }

    navigate(
      `/search?q=${encodeURIComponent(
        value
      )}`
    );
  }

  const festivalPosts =
    posts.filter(
      (post) =>
        post.category ===
        "festivals"
    );

  const featuredPrimary =
    posts[0] || seedPosts[0];

  const activeChapter =
    HERITAGE_TIMELINE_CHAPTERS.find(
      (item) => item.id === activeChapterId
    ) || HERITAGE_TIMELINE_CHAPTERS[0];

  return (
    <>
      {/* ============================================================
          LAYOUT 1: IMMERSIVE HERO SCREEN (Full-Bleed Stage + Glass HUD)
      ============================================================ */}
      <section
        className={`hero hero-immersive-stage lighting-${lightingMode}`}
        aria-label="Immersive Cultural Exhibition Stage"
      >
        <div className="hero-aurora-glow" aria-hidden="true" />

        <div className="container hero-stage-grid">
          {/* Left Editorial Liquid Glass Plaque */}
          <div className="hero-content glass-noir hero-glass-plaque">
            <div className="hero-telemetry-row">
              <span className="hero-kicker mono-eyebrow">
                NIGERIA&apos;S LIVING MEMORY
              </span>
              <span className="glass-pill-badge">
                9.0820° N, 8.6753° E
              </span>
            </div>

            <h1 className="heading hero-display-title">
              Discover Nigeria.
              <br />
              Understand Our Heritage.
            </h1>

            <p className="hero-lead">
              Explore the peoples,
              kingdoms, languages,
              festivals, foods, places and
              living traditions that make
              up Nigeria&apos;s cultural story.
            </p>

            <form
              className="hero-search glass-search-bar"
              onSubmit={submitSearch}
            >
              <Search size={21} />

              <input
                type="search"
                value={searchValue}
                onChange={(event) =>
                  setSearchValue(
                    event.target.value
                  )
                }
                placeholder="Search cultures, people, festivals, foods or places..."
                aria-label="Search Moji's Heritage"
              />

              <button
                className="btn earth"
                type="submit"
              >
                Search
              </button>
            </form>

            <div className="hero-actions">
              <Link
                className="btn earth"
                to="/cultures"
              >
                Explore Cultures
              </Link>

              <Link
                className="btn hero-outline"
                to="/visit"
              >
                Plan a Visit
              </Link>

              <a
                className="btn hero-glass-link"
                href="#artifact-provenance-viewer"
              >
                Inspect 3,000-Year Timeline ↓
              </a>
            </div>
          </div>

          {/* Right Floating Curator HUD & Hotspot Pin */}
          <aside
            className="hero-hud-column"
            aria-label="Curatorial Stage Telemetry"
          >
            {/* Interactive Artifact Hotspot Pin */}
            <div className="hero-hotspot-wrap">
              <button
                type="button"
                className="glass-pill-noir hotspot-trigger"
                aria-expanded={hotspotOpen}
                onClick={() =>
                  setHotspotOpen((prev) => !prev)
                }
              >
                <span className="hotspot-dot" aria-hidden="true" />
                <span>ANNOTATION 01: LIVING ARCHIVE</span>
              </button>

              {hotspotOpen && (
                <div className="glass-noir hotspot-popover" role="region" aria-label="Curatorial note">
                  <span className="mono-eyebrow">CURATORIAL FIELD NOTE</span>
                  <p>
                    From the 8,000-year-old Dufuna canoe in Yobe to the royal
                    bronze guilds of Benin and weaving looms of Iseyin, Nigerian
                    heritage spans over 250 distinct linguistic communities.
                  </p>
                </div>
              )}
            </div>

            {/* Gallery Lighting Rig Controller */}
            <div className="glass-noir hero-telemetry-dock">
              <div className="telemetry-dock-header">
                <span className="mono-eyebrow">GALLERY LIGHTING RIG</span>
                <span className="telemetry-status">STAGE PRESET</span>
              </div>

              <div className="lighting-preset-grid" role="group" aria-label="Stage Lighting Mode">
                <button
                  type="button"
                  aria-pressed={lightingMode === "raking"}
                  className={
                    lightingMode === "raking"
                      ? "lighting-btn active"
                      : "lighting-btn"
                  }
                  onClick={() => setLightingMode("raking")}
                >
                  ☀ Raking Gold
                </button>
                <button
                  type="button"
                  aria-pressed={lightingMode === "chiaroscuro"}
                  className={
                    lightingMode === "chiaroscuro"
                      ? "lighting-btn active"
                      : "lighting-btn"
                  }
                  onClick={() => setLightingMode("chiaroscuro")}
                >
                  ◐ Chiaroscuro
                </button>
              </div>

              <div className="telemetry-metrics">
                <div>
                  <small>CULTURAL ZONES</small>
                  <strong>6 Regions · 36 States</strong>
                </div>
                <div>
                  <small>CURATED ARCHIVE</small>
                  <strong>{posts.length || seedPosts.length}+ Editions</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ============================================================
          LAYOUT 2: BENTO GRID EXHIBITION DASHBOARD
      ============================================================ */}
      <section
        className="container section bento-exhibition-section"
        aria-labelledby="bento-exhibition-heading"
      >
        <SectionHeading
          eyebrow="Curated Digital Exhibition"
          title="The Living Heritage Bento"
          text="An interconnected view of featured masterworks, oral proverbs, geospatial sites, and historical timelines."
          link="/heritage"
          linkLabel="Open full archive"
        />

        <div className="bento-grid">
          {/* CELL 1: Primary 8-Col Feature Exhibition */}
          <article className="bento-cell bento-cell-hero">
            <img
              src={featuredPrimary.coverImage}
              alt={featuredPrimary.title}
              className="bento-hero-media"
              loading="lazy"
            />
            <div className="bento-hero-scrim" aria-hidden="true" />

            <div className="bento-hero-top">
              <span className="glass-pill-noir">
                FEATURED DOSSIER • {CATEGORY_LABELS[featuredPrimary.category] || "HERITAGE"}
              </span>
              {featuredPrimary.region && (
                <span className="glass-pill-noir">
                  {featuredPrimary.region}
                </span>
              )}
            </div>

            <div className="glass-noir bento-hero-plaque">
              <h3 id="bento-exhibition-heading" className="heading">
                <Link to={`/post/${featuredPrimary.id}`}>
                  {featuredPrimary.title}
                </Link>
              </h3>
              <p>{featuredPrimary.summary}</p>
              <div className="bento-hero-actions">
                <Link className="btn earth" to={`/post/${featuredPrimary.id}`}>
                  Enter Exhibition Story →
                </Link>
                <span className="bento-meta-pill">
                  <Clock size={15} />
                  {readingTime(featuredPrimary.body)}
                </span>
              </div>
            </div>
          </article>

          {/* CELL 2: Oral Proverb & Indigenous Lexicon */}
          <article className="bento-cell bento-cell-side glass-surface">
            <span className="mono-eyebrow">LIVING LEXICON • ORAL WISDOM</span>
            <blockquote className="bento-proverb">
              <p className="heading">
                &ldquo;Odò kì í ṣàn kó gbàgbé orísun rẹ̀.&rdquo;
              </p>
              <footer>
                — A river does not flow so far that it forgets its source.
                <span>Yorùbá Proverb · South West Archive</span>
              </footer>
            </blockquote>
            <Link className="text-link" to="/languages">
              Explore Nigerian Languages →
            </Link>
          </article>

          {/* CELL 3: Geospatial Cultural Atlas */}
          <article className="bento-cell bento-cell-side glass-surface">
            <div className="bento-card-head">
              <span className="mono-eyebrow">GEOSPATIAL ATLAS</span>
              <MapPin size={18} />
            </div>
            <h3 className="heading">
              {listings.length || 4} Verified Heritage Sites &amp; Festivals
            </h3>
            <p className="muted">
              Navigate sacred groves, royal palaces, and seasonal carnivals
              across Nigeria&apos;s six geopolitical zones.
            </p>
            <Link className="text-link" to="/visit">
              Launch Interactive Map →
            </Link>
          </article>

          {/* CELL 4: Chronological Span Meter */}
          <article className="bento-cell bento-cell-third glass-surface">
            <span className="mono-eyebrow">CHRONOLOGICAL DEPTH</span>
            <div className="bento-stat-figure heading">
              3,000+ <span>Years</span>
            </div>
            <p className="muted">
              Continuous material culture from Nok terracotta and Igbo-Ukwu
              metallurgy to living festivals.
            </p>
            <div className="bento-progress-track" aria-hidden="true">
              <div className="bento-progress-fill" />
            </div>
          </article>

          {/* CELL 5: Royal & Historical Personalities */}
          <article className="bento-cell bento-cell-third glass-surface">
            <span className="mono-eyebrow">HEROES &amp; HEROINES</span>
            <h3 className="heading">Queen Amina &amp; Historic Leaders</h3>
            <p className="muted">
              Biographies of rulers, scholars, warriors, and cultural pioneers
              who shaped Nigerian memory.
            </p>
            <Link className="text-link" to="/heroes">
              Read Biographies →
            </Link>
          </article>

          {/* CELL 6: Culinary Heritage */}
          <article className="bento-cell bento-cell-third glass-surface">
            <span className="mono-eyebrow">CULINARY ARCHIVE</span>
            <h3 className="heading">Traditional Foods &amp; Table</h3>
            <p className="muted">
              Regional preparation, indigenous ingredients, and ceremonial
              hospitality across communities.
            </p>
            <Link className="text-link" to="/foods">
              Explore Culinary Traditions →
            </Link>
          </article>
        </div>
      </section>

      {/* ============================================================
          LAYOUT 3: SPLIT-SCREEN ARTIFACT & PROVENANCE VIEWER
      ============================================================ */}
      <section
        id="artifact-provenance-viewer"
        className="split-artifact-section"
        aria-labelledby="split-viewer-heading"
      >
        <div className="container">
          <SectionHeading
            eyebrow="Interactive Provenance Dossier"
            title="Masterworks of Nigerian Civilization"
            text="Select any chronological era on the right to shift the optical inspection lens and examine material details."
            link="/histories"
            linkLabel="All historical essays"
          />

          <div className="split-viewer-grid">
            {/* LEFT: Sticky High-Impact Media Inspection Stage */}
            <div className="split-media-stage glass-noir">
              <div className="split-stage-toolbar">
                <span className="glass-pill-noir">
                  {activeChapter.periodLabel}
                </span>

                <div className="split-zoom-controls" role="group" aria-label="Artifact Zoom Controls">
                  <button
                    type="button"
                    className="zoom-btn"
                    onClick={() =>
                      setArtifactZoom((z) => Math.max(1, +(z - 0.15).toFixed(2)))
                    }
                    aria-label="Zoom out artifact"
                  >
                    −
                  </button>
                  <span className="zoom-readout">
                    {Math.round(activeChapter.zoomScale * artifactZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    className="zoom-btn"
                    onClick={() =>
                      setArtifactZoom((z) => Math.min(1.45, +(z + 0.15).toFixed(2)))
                    }
                    aria-label="Zoom in artifact"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="split-stage-viewport">
                <img
                  src={activeChapter.image}
                  alt={activeChapter.title}
                  loading="lazy"
                  style={{
                    objectPosition: activeChapter.focalPoint,
                    transform: `scale(${(
                      activeChapter.zoomScale * artifactZoom
                    ).toFixed(2)})`
                  }}
                  className="split-stage-image"
                />
                <div className="split-stage-callout glass-noir">
                  <span className="mono-eyebrow">STAGE VIEWPORT NOTE</span>
                  <strong>{activeChapter.detailCallout}</strong>
                </div>
              </div>

              <dl className="split-stage-specs">
                <div>
                  <dt>DOCUMENTED MEDIUM</dt>
                  <dd>{activeChapter.material}</dd>
                </div>
                <div>
                  <dt>CONTEXT &amp; CITATION</dt>
                  <dd>{activeChapter.provenanceContext}</dd>
                </div>
              </dl>
            </div>

            {/* RIGHT: Scrolling Glass Provenance Timeline */}
            <div className="split-timeline-column">
              <div className="split-timeline-spine">
                {HERITAGE_TIMELINE_CHAPTERS.map((chapter) => {
                  const isActive = chapter.id === activeChapter.id;
                  return (
                    <article
                      key={chapter.id}
                      tabIndex={0}
                      aria-current={isActive ? "step" : undefined}
                      onClick={() => setActiveChapterId(chapter.id)}
                      onMouseEnter={() => setActiveChapterId(chapter.id)}
                      onFocus={() => setActiveChapterId(chapter.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveChapterId(chapter.id);
                        }
                      }}
                      className={
                        isActive
                          ? "timeline-glass-card glass-surface active"
                          : "timeline-glass-card glass-surface"
                      }
                    >
                      <span
                        className={
                          isActive
                            ? "timeline-node active"
                            : "timeline-node"
                        }
                        aria-hidden="true"
                      />

                      <div className="timeline-card-meta">
                        <span className="mono-eyebrow">{chapter.era}</span>
                        {isActive && (
                          <span className="timeline-active-badge">
                            ACTIVE LENS
                          </span>
                        )}
                      </div>

                      <h3
                        id={
                          chapter.id === HERITAGE_TIMELINE_CHAPTERS[0].id
                            ? "split-viewer-heading"
                            : undefined
                        }
                        className="heading timeline-card-title"
                      >
                        {chapter.title}
                      </h3>

                      <p className="timeline-card-summary">
                        {chapter.summary}
                      </p>

                      <div className="timeline-card-footer">
                        <span>{chapter.material}</span>
                        <Link
                          to={chapter.storyLink}
                          className="text-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Read Archive →
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPLORE CULTURES */}
      <section className="container section">
        <SectionHeading
          eyebrow="People & Culture"
          title="Explore by Culture"
          text="Connect history, language, food, festivals, personalities and traditions through Nigeria's diverse communities."
          link="/cultures"
          linkLabel="View cultures"
        />

        <div className="culture-grid">
          {cultures
            .slice(0, 6)
            .map((culture) => (
              <Link
                key={culture.slug}
                className="culture-card"
                to={`/cultures/${culture.slug}`}
              >
                <span className="tag">
                  {culture.region}
                </span>

                <h3 className="heading">
                  {culture.name}
                </h3>

                <p>
                  {culture.description}
                </p>

                <strong>
                  Explore{" "}
                  {culture.name} →
                </strong>
              </Link>
            ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="section section-alt">
        <div className="container">
          <SectionHeading
            eyebrow="Featured"
            title="Stories worth discovering"
            text="Begin with selected stories from across the Moji's Heritage collection."
          />

          <div className="grid cards">
            {posts
              .slice(0, 3)
              .map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  showCategory
                />
              ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container section">
        <SectionHeading
          eyebrow="The Collection"
          title="Explore by Topic"
          text="Move from history to language, food, festivals, personalities and cultural practices."
        />

        <div className="category-grid">
          {categories.map(
            ([key, name]) => (
              <Link
                className="category-card"
                key={key}
                to={
                  key === "gallery"
                    ? "/gallery"
                    : `/${key}`
                }
              >
                <span className="category-number">
                  {String(
                    categories.findIndex(
                      ([item]) =>
                        item === key
                    ) + 1
                  ).padStart(2, "0")}
                </span>

                <h3 className="heading">
                  {name}
                </h3>

                <p>
                  Stories, knowledge and
                  discoveries from across
                  Nigeria.
                </p>

                <strong>
                  Explore →
                </strong>
              </Link>
            )
          )}
        </div>
      </section>

      {/* FESTIVALS */}
      <section className="section festival-home">
        <div className="container">
          <SectionHeading
            eyebrow="Cultural Calendar"
            title="Festivals & Celebrations"
            text="Discover celebrations and plan cultural experiences throughout the year."
            link="/calendar"
            linkLabel="Open calendar"
          />

          <div className="grid cards">
            {festivalPosts
              .slice(0, 3)
              .map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                />
              ))}

            {!festivalPosts.length &&
              listings
                .slice(0, 3)
                .map((listing) => (
                  <Link
                    key={listing.id}
                    to={`/visit/${listing.id}`}
                    className="card card-body"
                  >
                    <span className="tag">
                      {
                        listing.festivalType
                      }
                    </span>

                    <h3 className="heading">
                      {listing.name}
                    </h3>

                    <p className="muted">
                      {listing.state} ·{" "}
                      {
                        listing.ethnicGroup
                      }
                    </p>

                    <strong>
                      Discover →
                    </strong>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* VISIT NIGERIA */}
      <section className="container section">
        <div className="visit-cta">
          <div>
            <span className="eyebrow light">
              Visit Nigeria
            </span>

            <h2 className="heading">
              Experience heritage beyond
              the screen.
            </h2>

            <p>
              Search cultural festivals,
              heritage sites and places,
              then switch to the map to
              understand where they are
              across Nigeria.
            </p>

            <Link
              className="btn earth"
              to="/visit"
            >
              Open Visit Planner
            </Link>
          </div>

          <div className="visit-preview">
            {listings
              .slice(0, 3)
              .map((item) => (
                <Link
                  key={item.id}
                  to={`/visit/${item.id}`}
                >
                  <MapPin size={17} />

                  <span>
                    <strong>
                      {item.name}
                    </strong>
                    <small>
                      {item.state}
                    </small>
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* LATEST */}
      <section className="section section-alt">
        <div className="container">
          <SectionHeading
            eyebrow="Latest"
            title="Continue learning"
            text="Explore more stories from across the collection."
            link="/search"
            linkLabel="Search everything"
          />

          <div className="grid cards">
            {posts
              .slice(3, 9)
              .map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  showCategory
                />
              ))}
          </div>
        </div>
      </section>

      {/* YOUTUBE */}
      <section className="container section">
        <div className="youtube-cta">
          <YouTubeIcon size={48} />

          <div>
            <span className="eyebrow">
              Watch & Learn
            </span>

            <h2 className="heading">
              Continue the journey on
              YouTube
            </h2>

            <p>
              Moji's Heritage keeps video
              outside the website to
              reduce bandwidth use. Visit
              our YouTube channel for
              audiovisual cultural
              stories and documentaries.
            </p>
          </div>

          <a
            href={channel}
            target="_blank"
            rel="noopener noreferrer"
            className="btn earth"
          >
            Visit YouTube
          </a>
        </div>
      </section>

      {/* RECENTLY VIEWED */}
      {recent.length > 0 && (
        <section className="container section">
          <SectionHeading
            eyebrow="Your Journey"
            title="Continue Exploring"
            text="Recently viewed stories are saved only in this browser."
          />

          <div className="recent-grid">
            {recent.map((item) => (
              <Link
                key={item.id}
                to={`/post/${item.id}`}
                className="recent-card"
              >
                {item.coverImage && (
                  <img
                    loading="lazy"
                    src={
                      item.coverImage
                    }
                    alt={item.title}
                  />
                )}

                <div>
                  <small>
                    {CATEGORY_LABELS[
                      item.category
                    ] ||
                      item.category}
                  </small>

                  <strong>
                    {item.title}
                  </strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ABOUT CTA */}
      <section className="container section">
        <div className="about-home">
          <div>
            <span className="eyebrow">
              Why Moji's Heritage?
            </span>

            <h2 className="heading">
              Cultural knowledge should
              be discoverable.
            </h2>

            <p>
              Moji's Heritage is being
              built as an accessible
              digital home for learning
              about Nigeria's histories,
              communities, languages,
              traditions and cultural
              places.
            </p>

            <Link
              to="/about"
              className="text-link"
            >
              Learn about the project →
            </Link>
          </div>

          <div>
            <h3 className="heading">
              Have information to share?
            </h3>

            <p>
              Researchers, community
              members and visitors can
              contact us about cultural
              discoveries, corrections,
              festivals, partnerships or
              research.
            </p>

            <Link
              to="/contact"
              className="btn primary"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* ----------------------------------
   CATEGORY
---------------------------------- */

export function Category({
  category,
  title
}) {
  const [posts, setPosts] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [ethnicGroup, setEthnicGroup] =
    useState("All");

  useEffect(() => {
    getPosts()
      .then((items) =>
        setPosts(
          items.filter(
            (post) =>
              post.category ===
              category
          )
        )
      )
      .catch(() => setPosts([]));
  }, [category]);

  const groups = useMemo(() => {
    return [
      "All",
      ...new Set(
        posts
          .map(
            (post) =>
              post.ethnicGroup
          )
          .filter(Boolean)
      )
    ];
  }, [posts]);

  const filtered =
    posts.filter((post) => {
      const matchesSearch =
        normalise(
          `${post.title} ${post.summary} ${post.ethnicGroup} ${post.region}`
        ).includes(
          normalise(search)
        );

      const matchesGroup =
        ethnicGroup === "All" ||
        post.ethnicGroup ===
          ethnicGroup;

      return (
        matchesSearch &&
        matchesGroup
      );
    });

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">
            Moji's Heritage Collection
          </span>

          <h1 className="heading">
            {title}
          </h1>

          <p>
            {CATEGORY_DESCRIPTIONS[
              category
            ] ||
              "Explore published stories and discoveries from across Nigeria."}
          </p>
        </div>
      </section>

      <section className="container section">
        <div className="content-toolbar">
          <div className="search-box">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={`Search ${title.toLowerCase()}...`}
              aria-label={`Search ${title}`}
            />
          </div>

          <select
            value={ethnicGroup}
            onChange={(event) =>
              setEthnicGroup(
                event.target.value
              )
            }
            aria-label="Filter by ethnic group"
          >
            {groups.map((group) => (
              <option
                key={group}
                value={group}
              >
                {group === "All"
                  ? "All ethnic groups"
                  : group}
              </option>
            ))}
          </select>
        </div>

        <p className="result-count">
          {filtered.length}{" "}
          {filtered.length === 1
            ? "story"
            : "stories"}
        </p>

        {filtered.length ? (
          <div className="grid cards">
            {filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No stories match your filters"
            text="Try another search term or clear the ethnic-group filter."
            action={`/${category}`}
            actionLabel="Clear filters"
          />
        )}
      </section>
    </>
  );
}

/* ----------------------------------
   CULTURES DIRECTORY
---------------------------------- */

export function Cultures() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">
            People & Culture
          </span>

          <h1 className="heading">
            Explore Nigeria by Culture
          </h1>

          <p>
            Discover connected stories
            about history, language,
            festivals, food,
            personalities and living
            traditions.
          </p>
        </div>
      </section>

      <section className="container section">
        <div className="culture-directory">
          {cultures.map(
            (culture) => (
              <article
                className="culture-directory-card"
                key={culture.slug}
              >
                <span className="tag">
                  {culture.region}
                </span>

                <h2 className="heading">
                  {culture.name}
                </h2>

                <p>
                  {
                    culture.description
                  }
                </p>

                <p className="muted">
                  <strong>
                    Associated states:
                  </strong>{" "}
                  {culture.states.join(
                    ", "
                  )}
                </p>

                <Link
                  className="btn primary"
                  to={`/cultures/${culture.slug}`}
                >
                  Explore{" "}
                  {culture.name}
                </Link>
              </article>
            )
          )}
        </div>

        <div className="notice cultural-note">
          Nigeria contains hundreds of
          ethnic and linguistic
          communities. This directory is
          a growing starting point, not
          an exhaustive list. Additional
          communities can be added as
          the collection develops.
        </div>
      </section>
    </>
  );
}

/* ----------------------------------
   CULTURE DETAIL
---------------------------------- */

export function CultureDetail() {
  const { slug } = useParams();

  const [posts, setPosts] =
    useState([]);

  const culture =
    getCultureBySlug(slug);

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  if (!culture) {
    return (
      <NotFound
        customTitle="Culture not found"
      />
    );
  }

  const related =
    posts.filter((post) => {
      const group =
        normalise(
          post.ethnicGroup
        );

      return (
        group.includes(
          normalise(culture.name)
        ) ||
        normalise(
          culture.name
        ).includes(group)
      );
    });

  const sections = [
    ["heritage", "Cultural Heritage"],
    ["histories", "History"],
    ["festivals", "Festivals"],
    ["foods", "Traditional Foods"],
    ["languages", "Language"],
    ["heroes", "Heroes & Heroines"],
    ["documentaries", "Documentaries"]
  ];

  return (
    <>
      <section className="culture-hero">
        <div className="container">
          <Link
            to="/cultures"
            className="back-link"
          >
            ← Back to cultures
          </Link>

          <span className="eyebrow light">
            {culture.region}
          </span>

          <h1 className="heading">
            Explore {culture.name}
          </h1>

          <p>
            {culture.introduction}
          </p>

          <div className="culture-states">
            {culture.states.map(
              (state) => (
                <span key={state}>
                  {state}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      <section className="container section">
        {related.length === 0 && (
          <EmptyState
            title={`The ${culture.name} collection is growing`}
            text="No matching published stories are available yet. New cultural stories can be added through the Moji's Heritage admin newsroom."
            action="/cultures"
            actionLabel="Explore other cultures"
          />
        )}

        {sections.map(
          ([category, label]) => {
            const items =
              related.filter(
                (post) =>
                  post.category ===
                  category
              );

            if (!items.length) {
              return null;
            }

            return (
              <section
                className="culture-section"
                key={category}
              >
                <SectionHeading
                  title={label}
                  text={`Explore ${culture.name} ${label.toLowerCase()}.`}
                />

                <div className="grid cards">
                  {items.map(
                    (post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                      />
                    )
                  )}
                </div>
              </section>
            );
          }
        )}
      </section>
    </>
  );
}

/* ----------------------------------
   FESTIVAL CALENDAR
---------------------------------- */

export function FestivalCalendar() {
  const [posts, setPosts] =
    useState([]);

  const [listings, setListings] =
    useState([]);

  const [selectedMonth, setSelectedMonth] =
    useState("All");

  useEffect(() => {
    getPosts()
      .then((items) =>
        setPosts(
          items.filter(
            (post) =>
              post.category ===
              "festivals"
          )
        )
      )
      .catch(() => setPosts([]));

    getListings()
      .then(setListings)
      .catch(() => setListings([]));
  }, []);

  const calendarItems =
    useMemo(() => {
      const listingItems =
        listings.map((item) => ({
          id: `listing-${item.id}`,
          sourceId: item.id,
          type: "listing",
          title: item.name,
          month:
            item.startMonth ||
            "Date varies",
          state: item.state,
          ethnicGroup:
            item.ethnicGroup,
          festivalType:
            item.festivalType,
          description:
            item.description
        }));

      const postItems =
        posts.map((post) => ({
          id: `post-${post.id}`,
          sourceId: post.id,
          type: "post",
          title: post.title,
          month:
            post.month ||
            post.startMonth ||
            "Date varies",
          state:
            post.state || "",
          ethnicGroup:
            post.ethnicGroup,
          festivalType:
            "Festival Story",
          description:
            post.summary
        }));

      const combined = [
        ...listingItems,
        ...postItems
      ];

      const seen = new Set();

      return combined.filter(
        (item) => {
          const key =
            normalise(item.title);

          if (seen.has(key)) {
            return false;
          }

          seen.add(key);
          return true;
        }
      );
    }, [posts, listings]);

  const visibleItems =
    selectedMonth === "All"
      ? calendarItems
      : calendarItems.filter(
          (item) =>
            normalise(
              item.month
            ).includes(
              normalise(
                selectedMonth
              )
            )
        );

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">
            Plan the Year
          </span>

          <h1 className="heading">
            Nigerian Cultural Calendar
          </h1>

          <p>
            Browse festivals and cultural
            experiences by month. Dates
            can change, especially where
            celebrations follow local,
            religious or traditional
            calendars, so always confirm
            current official information
            before travelling.
          </p>
        </div>
      </section>

      <section className="container section">
        <div className="month-selector">
          <button
            type="button"
            className={
              selectedMonth === "All"
                ? "month active"
                : "month"
            }
            onClick={() =>
              setSelectedMonth("All")
            }
          >
            All
          </button>

          {MONTHS.map((month) => (
            <button
              type="button"
              key={month}
              className={
                selectedMonth ===
                month
                  ? "month active"
                  : "month"
              }
              onClick={() =>
                setSelectedMonth(
                  month
                )
              }
            >
              {month.slice(0, 3)}
            </button>
          ))}
        </div>

        {visibleItems.length ? (
          <div className="calendar-list">
            {visibleItems.map(
              (item) => (
                <article
                  className="calendar-item"
                  key={item.id}
                >
                  <div className="calendar-date">
                    <CalendarDays
                      size={20}
                    />
                    <strong>
                      {item.month}
                    </strong>
                  </div>

                  <div>
                    <span className="tag">
                      {
                        item.festivalType
                      }
                    </span>

                    <h2 className="heading">
                      {item.title}
                    </h2>

                    <p className="muted">
                      {[
                        item.state,
                        item.ethnicGroup
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    <p>
                      {
                        item.description
                      }
                    </p>

                    <Link
                      className="text-link"
                      to={
                        item.type ===
                        "listing"
                          ? `/visit/${item.sourceId}`
                          : `/post/${item.sourceId}`
                      }
                    >
                      View details →
                    </Link>
                  </div>
                </article>
              )
            )}
          </div>
        ) : (
          <EmptyState
            title={`No listed festivals for ${selectedMonth}`}
            text="The calendar grows as administrators add verified festival and event information."
            action="/calendar"
            actionLabel="Show full calendar"
          />
        )}
      </section>
    </>
  );
}

/* ----------------------------------
   GALLERY
---------------------------------- */

export function Gallery() {
  const images =
    seedPosts
      .concat(seedPosts)
      .slice(0, 12);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">
            Visual Heritage
          </span>

          <h1 className="heading">
            Photo Gallery
          </h1>

          <p>
            A visual introduction to
            stories, places and cultural
            themes represented across
            Moji's Heritage.
          </p>
        </div>
      </section>

      <section className="container section">
        <div className="gallery-grid">
          {images.map(
            (post, index) => (
              <figure
                className="gallery-item"
                key={`${post.id}-${index}`}
              >
                <img
                  loading="lazy"
                  src={
                    post.coverImage
                  }
                  alt={`${post.title} cultural gallery`}
                />

                <figcaption>
                  {post.title}
                </figcaption>
              </figure>
            )
          )}
        </div>
      </section>
    </>
  );
}

/* ----------------------------------
   ARTICLE
---------------------------------- */

export function Post() {
  const { id } = useParams();

  const [post, setPost] =
    useState(null);

  const [allPosts, setAllPosts] =
    useState([]);

  const [comments, setComments] =
    useState([]);

  const [name, setName] =
    useState("");

  const [text, setText] =
    useState("");

  const [commentState, setCommentState] =
    useState("");

  const {
    isSaved,
    toggleSaved
  } = useSavedPosts();

  useEffect(() => {
    getPosts()
      .then((posts) => {
        setAllPosts(posts);

        const found =
          posts.find(
            (item) =>
              item.id === id
          );

        setPost(found || null);

        if (found) {
          bumpView(id);
          addRecentlyViewed(found);
        }
      })
      .catch(() => {
        setPost(null);
      });

    if (firebaseReady) {
      getDocs(
        query(
          collection(
            db,
            "comments"
          ),
          where(
            "postId",
            "==",
            id
          ),
          where(
            "isApproved",
            "==",
            true
          )
        )
      )
        .then((snapshot) => {
          setComments(
            snapshot.docs
              .map((document) => ({
                id: document.id,
                ...document.data()
              }))
              .filter(
                (comment) =>
                  comment.isApproved !==
                  false
              )
          );
        })
        .catch(() =>
          setComments([])
        );
    }
  }, [id]);

  async function submitComment(event) {
  event.preventDefault();

  const cleanName = name.trim();
  const cleanText = text.trim();

  if (cleanName.length < 2) {
    setCommentState(
      "Please enter a name with at least 2 characters."
    );
    return;
  }

  if (cleanText.length < 3) {
    setCommentState(
      "Please write a meaningful comment."
    );
    return;
  }

  if (!firebaseReady || !db) {
    setCommentState(
      "Comments are temporarily unavailable."
    );
    return;
  }

  try {
    setCommentState("Submitting…");

    await addDoc(collection(db, "comments"), {
      postId: id,
      displayName: cleanName.slice(0, 60),
      text: cleanText.slice(0, 1000),

      // Every public comment MUST wait for admin approval.
      isApproved: false,
      isFlagged: false,

      createdAt: serverTimestamp()
    });

    setName("");
    setText("");

    setCommentState(
      "Thank you. Your comment was submitted for moderation."
    );
  } catch (error) {
    console.error("Comment submission error:", error);

    setCommentState(
      "Unable to submit your comment. Please try again."
    );
  }
}

  if (!post) {
    return (
      <PageLoading text="Loading story…" />
    );
  }

  const related =
    allPosts
      .filter(
        (item) =>
          item.id !== post.id &&
          (item.category ===
            post.category ||
            item.ethnicGroup ===
              post.ethnicGroup)
      )
      .slice(0, 3);

  const saved =
    isSaved(post.id);

  const updated =
    post.updatedAt?.toDate
      ? post.updatedAt
          .toDate()
          .toLocaleDateString()
      : post.updatedAt
        ? new Date(
            post.updatedAt
          ).toLocaleDateString()
        : null;

  return (
    <>
      <article className="article-page">
        <header className="article-header container">
          <div className="article-breadcrumb">
            <Link to="/">
              Home
            </Link>
            <span>›</span>
            <Link
              to={`/${post.category}`}
            >
              {CATEGORY_LABELS[
                post.category
              ] || post.category}
            </Link>
          </div>

          <div className="article-tags">
            <span className="tag">
              {CATEGORY_LABELS[
                post.category
              ] || post.category}
            </span>

            {post.ethnicGroup && (
              <span className="tag soft">
                {post.ethnicGroup}
              </span>
            )}
          </div>

          <h1 className="heading article-title">
            {post.title}
          </h1>

          <p className="article-summary">
            {post.summary}
          </p>

          <div className="article-meta">
            <span>
              <Clock size={17} />
              {readingTime(
                post.body
              )}
            </span>

            {post.region && (
              <span>
                <MapPin size={17} />
                {post.region}
              </span>
            )}

            {updated && (
              <span>
                Updated {updated}
              </span>
            )}
          </div>

          <div className="article-actions">
            <button
              type="button"
              className={
                saved
                  ? "btn primary"
                  : "btn outline"
              }
              onClick={() =>
                toggleSaved(post.id)
              }
            >
              <Bookmark
                size={17}
                fill={
                  saved
                    ? "currentColor"
                    : "none"
                }
              />

              {saved
                ? "Saved"
                : "Save for later"}
            </button>

            <button
              type="button"
              className="btn outline"
              onClick={() =>
                window.print()
              }
            >
              <Printer size={17} />
              Print / Save PDF
            </button>
          </div>
        </header>

        <div className="container">
          <img
            src={post.coverImage}
            alt={post.title}
            className="article-cover"
          />
        </div>

        <div className="container article-layout">
          <main className="article-main">
            <div className="article-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  )
                }}
              >
                {String(post.body || "")}
              </ReactMarkdown>
            </div>

            {post.youtubeUrl && (
              <div className="youtube-story">
                <YouTubeIcon size={28} />

                <div>
                  <h3 className="heading">
                    Continue watching
                  </h3>

                  <p>
                    This story has an
                    external YouTube
                    resource.
                  </p>
                </div>

                <a
                  className="btn earth"
                  href={
                    post.youtubeUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Watch on YouTube
                </a>
              </div>
            )}

            <div className="article-share">
              <h3 className="heading">
                Share this story
              </h3>

              <Share
                title={post.title}
              />
            </div>

            <section className="comments">
              <div className="comments-heading">
                <div>
                  <span className="eyebrow">
                    Community
                  </span>

                  <h2 className="heading">
                    Visitor Opinions
                  </h2>
                </div>

                <span>
                  {comments.length}{" "}
                  {comments.length === 1
                    ? "comment"
                    : "comments"}
                </span>
              </div>

              {comments.length ? (
                comments.map(
                  (comment) => (
                    <div
                      className="comment"
                      key={
                        comment.id
                      }
                    >
                      <b>
                        {
                          comment.displayName
                        }
                      </b>

                      <p>
                        {comment.text}
                      </p>
                    </div>
                  )
                )
              ) : (
                <p className="muted">
                  No approved visitor
                  comments yet.
                </p>
              )}

              <div className="comment-form-wrap">
                <h3 className="heading">
                  Leave your opinion
                </h3>

                <p className="muted">
                  No account is required.
                  Comments are reviewed
                  before public display.
                </p>

                {commentState && (
                  <div
                    className={
                      commentState.startsWith(
                        "Thank"
                      )
                        ? "success"
                        : "notice"
                    }
                  >
                    {commentState}
                  </div>
                )}

                <form
                  className="form"
                  onSubmit={
                    submitComment
                  }
                >
                  <div className="field">
                    <label htmlFor="comment-name">
                      Name
                    </label>

                    <input
                      id="comment-name"
                      value={name}
                      onChange={(
                        event
                      ) =>
                        setName(
                          event.target
                            .value
                        )
                      }
                      maxLength="60"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="comment-text">
                      Comment
                    </label>

                    <textarea
                      id="comment-text"
                      value={text}
                      onChange={(
                        event
                      ) =>
                        setText(
                          event.target
                            .value
                        )
                      }
                      maxLength="1000"
                      required
                    />

                    <small className="muted">
                      {text.length}/1000
                    </small>
                  </div>

                  <button
                    className="btn primary"
                    type="submit"
                  >
                    Submit Comment
                  </button>
                </form>
              </div>
            </section>
          </main>

          <aside className="article-sidebar">
            <div className="sidebar-box">
              <h3 className="heading">
                About this story
              </h3>

              <dl className="article-facts">
                <div>
                  <dt>Category</dt>
                  <dd>
                    {CATEGORY_LABELS[
                      post.category
                    ] ||
                      post.category}
                  </dd>
                </div>

                <div>
                  <dt>
                    Culture / Group
                  </dt>
                  <dd>
                    {post.ethnicGroup ||
                      "Multiple"}
                  </dd>
                </div>

                <div>
                  <dt>Region</dt>
                  <dd>
                    {post.region ||
                      "Nigeria"}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="section section-alt related-section">
          <div className="container">
            <SectionHeading
              eyebrow="Keep Exploring"
              title="Related Stories"
            />

            <div className="grid cards">
              {related.map(
                (item) => (
                  <PostCard
                    key={item.id}
                    post={item}
                  />
                )
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ----------------------------------
   SEARCH
---------------------------------- */

export function SearchPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const initialQuery =
    searchParams.get("q") || "";

  const [search, setSearch] =
    useState(initialQuery);

  const [posts, setPosts] =
    useState([]);

  const [listings, setListings] =
    useState([]);

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch(() => setPosts([]));

    getListings()
      .then(setListings)
      .catch(() => setListings([]));
  }, []);

  useEffect(() => {
    setSearch(
      searchParams.get("q") || ""
    );
  }, [searchParams]);

  function updateSearch(value) {
    setSearch(value);

    if (value.trim()) {
      setSearchParams({
        q: value
      });
    } else {
      setSearchParams({});
    }
  }

  const queryValue =
    normalise(search);

  const matchingPosts =
    posts.filter((post) =>
      normalise(
        `${post.title} ${post.summary} ${post.ethnicGroup} ${post.region} ${post.category}`
      ).includes(queryValue)
    );

  const matchingListings =
    listings.filter((item) =>
      normalise(
        `${item.name} ${item.description} ${item.state} ${item.region} ${item.ethnicGroup} ${item.festivalType}`
      ).includes(queryValue)
    );

  const matchingCultures =
    cultures.filter((culture) =>
      normalise(
        `${culture.name} ${culture.region} ${culture.states.join(
          " "
        )} ${culture.description}`
      ).includes(queryValue)
    );

  const total =
    matchingPosts.length +
    matchingListings.length +
    matchingCultures.length;

  return (
    <>
      <section className="search-hero">
        <div className="container">
          <span className="eyebrow light">
            Search
          </span>

          <h1 className="heading">
            Search Moji's Heritage
          </h1>

          <div className="search-large">
            <Search size={22} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                updateSearch(
                  event.target.value
                )
              }
              placeholder="Search history, culture, language, festival, food, people or places..."
              aria-label="Search history, culture, language, festival, food, people or places"
              autoFocus
            />
          </div>
        </div>
      </section>

      <section className="container section">
        {search.trim() ? (
          <>
            <p className="result-count">
              {total} results for{" "}
              <strong>
                “{search}”
              </strong>
            </p>

            {matchingCultures.length >
              0 && (
              <section className="search-group">
                <SectionHeading
                  title="Cultures"
                />

                <div className="search-simple-grid">
                  {matchingCultures.map(
                    (culture) => (
                      <Link
                        className="search-result-simple"
                        key={
                          culture.slug
                        }
                        to={`/cultures/${culture.slug}`}
                      >
                        <span className="tag">
                          {
                            culture.region
                          }
                        </span>

                        <strong>
                          {
                            culture.name
                          }
                        </strong>

                        <small>
                          {
                            culture.description
                          }
                        </small>
                      </Link>
                    )
                  )}
                </div>
              </section>
            )}

            {matchingPosts.length >
              0 && (
              <section className="search-group">
                <SectionHeading
                  title="Stories"
                />

                <div className="grid cards">
                  {matchingPosts.map(
                    (post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        showCategory
                      />
                    )
                  )}
                </div>
              </section>
            )}

            {matchingListings.length >
              0 && (
              <section className="search-group">
                <SectionHeading
                  title="Places & Experiences"
                />

                <div className="search-simple-grid">
                  {matchingListings.map(
                    (item) => (
                      <Link
                        className="search-result-simple"
                        key={item.id}
                        to={`/visit/${item.id}`}
                      >
                        <span className="tag">
                          {
                            item.festivalType
                          }
                        </span>

                        <strong>
                          {item.name}
                        </strong>

                        <small>
                          {item.state} ·{" "}
                          {
                            item.ethnicGroup
                          }
                        </small>
                      </Link>
                    )
                  )}
                </div>
              </section>
            )}

            {total === 0 && (
              <EmptyState
                title="Nothing matched your search"
                text="Try a culture, state, historical figure, festival, language or food."
                action="/"
                actionLabel="Return Home"
              />
            )}
          </>
        ) : (
          <div className="search-start">
            <Search size={40} />

            <h2 className="heading">
              What would you like to
              discover?
            </h2>

            <p className="muted">
              Try Yoruba, Benin, Kano,
              festival, language, food or
              a place in Nigeria.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

/* ----------------------------------
   SAVED STORIES
---------------------------------- */

export function Saved() {
  const [posts, setPosts] =
    useState([]);

  const {
    saved,
    clearSaved
  } = useSavedPosts();

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch(() => setPosts([]));
  }, []);

  const savedPosts =
    posts.filter((post) =>
      saved.includes(post.id)
    );

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">
            Your Browser
          </span>

          <h1 className="heading">
            Saved Stories
          </h1>

          <p>
            Save stories without creating
            an account. Your saved list
            remains only in this browser.
          </p>
        </div>
      </section>

      <section className="container section">
        {savedPosts.length ? (
          <>
            <div className="saved-toolbar">
              <p>
                {savedPosts.length} saved{" "}
                {savedPosts.length === 1
                  ? "story"
                  : "stories"}
              </p>

              <button
                type="button"
                className="btn outline"
                onClick={clearSaved}
              >
                Clear Saved Stories
              </button>
            </div>

            <div className="grid cards">
              {savedPosts.map(
                (post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    showCategory
                  />
                )
              )}
            </div>
          </>
        ) : (
          <EmptyState
            title="You haven't saved any stories yet"
            text="Use the bookmark button on a story to keep it here for later."
            action="/heritage"
            actionLabel="Explore Stories"
          />
        )}
      </section>
    </>
  );
}

/* ----------------------------------
   VISIT PLANNER
---------------------------------- */

export function Visit() {
  const [items, setItems] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [view, setView] =
    useState("list");

  const [state, setState] =
    useState("All");

  const [type, setType] =
    useState("All");

  useEffect(() => {
    getListings()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const states = [
    "All",
    ...new Set(
      items
        .map((item) => item.state)
        .filter(Boolean)
    )
  ];

  const types = [
    "All",
    ...new Set(
      items
        .map(
          (item) =>
            item.festivalType
        )
        .filter(Boolean)
    )
  ];

  const results =
    items.filter((item) => {
      const matchesSearch =
        normalise(
          `${item.name} ${item.state} ${item.ethnicGroup} ${item.festivalType} ${item.localGovernmentArea}`
        ).includes(
          normalise(search)
        );

      const matchesState =
        state === "All" ||
        item.state === state;

      const matchesType =
        type === "All" ||
        item.festivalType === type;

      return (
        matchesSearch &&
        matchesState &&
        matchesType
      );
    });

  return (
    <>
      <section className="visit-hero">
        <div className="container">
          <span className="eyebrow light">
            Travel & Discovery
          </span>

          <h1 className="heading">
            Visit & Festival Planner
          </h1>

          <p>
            Discover cultural festivals,
            heritage sites and places
            across Nigeria.
          </p>
        </div>
      </section>

      <section className="container section">
        <div className="visit-toolbar">
          <div className="search-box">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search place, state or ethnic group..."
              aria-label="Search place, state or ethnic group"
            />
          </div>

          <select
            value={state}
            onChange={(event) =>
              setState(
                event.target.value
              )
            }
            aria-label="Filter destinations by state"
          >
            {states.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All states"
                  : item}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(event) =>
              setType(
                event.target.value
              )
            }
            aria-label="Filter destinations by type"
          >
            {types.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All types"
                  : item}
              </option>
            ))}
          </select>

          <button
            className="btn primary"
            type="button"
            onClick={() =>
              setView(
                view === "list"
                  ? "map"
                  : "list"
              )
            }
          >
            {view === "list"
              ? "Map View"
              : "List View"}
          </button>
        </div>

        <p className="result-count">
          {results.length} places and
          experiences
        </p>

        {view === "list" ? (
          results.length ? (
            <div className="grid cards">
              {results.map(
                (item) => (
                  <article
                    className="card visit-card"
                    key={item.id}
                  >
                    <img
                      loading="lazy"
                      src={
                        item.photos?.[0]
                      }
                      alt={item.name}
                    />

                    <div className="card-body">
                      <span className="tag">
                        {
                          item.festivalType
                        }
                      </span>

                      <h3 className="heading">
                        {item.name}
                      </h3>

                      <p className="visit-location">
                        <MapPin
                          size={16}
                        />
                        {item.state} ·{" "}
                        {
                          item.localGovernmentArea
                        }
                      </p>

                      <p className="muted">
                        {
                          item.ethnicGroup
                        }{" "}
                        ·{" "}
                        {
                          item.startMonth
                        }
                      </p>

                      <p className="clamp-two">
                        {
                          item.description
                        }
                      </p>

                      <Link
                        className="btn primary"
                        to={`/visit/${item.id}`}
                      >
                        View Details
                      </Link>
                    </div>
                  </article>
                )
              )}
            </div>
          ) : (
            <EmptyState
              title="No places match your filters"
              text="Try another search term or change your state and type filters."
              action="/visit"
              actionLabel="Clear Filters"
            />
          )
        ) : (
          <MapContainer
            center={[
              9.082,
              8.6753
            ]}
            zoom={6}
            className="map"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {results.map(
              (item) => (
                <Marker
                  key={item.id}
                  position={[
                    item.coordinates
                      .lat,
                    item.coordinates
                      .lng
                  ]}
                >
                  <Popup>
                    <strong>
                      {item.name}
                    </strong>

                    <br />

                    {item.state}

                    <br />

                    <Link
                      to={`/visit/${item.id}`}
                    >
                      View Details
                    </Link>
                  </Popup>
                </Marker>
              )
            )}
          </MapContainer>
        )}
      </section>
    </>
  );
}

/* ----------------------------------
   VISIT DETAIL
---------------------------------- */

export function VisitDetail() {
  const { id } = useParams();

  const [item, setItem] =
    useState(null);

  useEffect(() => {
    getListings()
      .then((items) =>
        setItem(
          items.find(
            (listing) =>
              listing.id === id
          ) || null
        )
      )
      .catch(() =>
        setItem(null)
      );
  }, [id]);

  if (!item) {
    return (
      <PageLoading text="Loading destination…" />
    );
  }

  return (
    <>
      <section className="visit-detail-hero">
        <img
          src={item.photos?.[0]}
          alt={item.name}
        />

        <div className="visit-detail-overlay">
          <div className="container">
            <span className="tag">
              {item.festivalType}
            </span>

            <h1 className="heading">
              {item.name}
            </h1>

            <p>
              <MapPin size={18} />
              {item.localGovernmentArea},{" "}
              {item.state}
            </p>
          </div>
        </div>
      </section>

      <section className="container section visit-detail-layout">
        <main>
          <h2 className="heading">
            About this place
          </h2>

          {String(
            item.description || ""
          )
            .split("\n\n")
            .map(
              (
                paragraph,
                index
              ) => (
                <p key={index}>
                  {paragraph}
                </p>
              )
            )}

          <h2 className="heading">
            Cultural Context
          </h2>

          <p>
            This destination is
            associated with{" "}
            <strong>
              {item.ethnicGroup}
            </strong>{" "}
            cultural heritage and is
            listed as a{" "}
            <strong>
              {item.festivalType}
            </strong>
            .
          </p>

          <h2 className="heading">
            Practical Visit Tips
          </h2>

          <p>{item.visitTips}</p>

          {item.photos?.length > 1 && (
            <>
              <h2 className="heading">
                Gallery
              </h2>

              <div className="gallery-grid small">
                {item.photos.map(
                  (
                    photo,
                    index
                  ) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`${item.name} ${index + 1}`}
                    />
                  )
                )}
              </div>
            </>
          )}

          <Share
            title={item.name}
          />
        </main>

        <aside>
          <div className="sidebar-box">
            <h3 className="heading">
              Visit Information
            </h3>

            <dl className="article-facts">
              <div>
                <dt>State</dt>
                <dd>{item.state}</dd>
              </div>

              <div>
                <dt>Region</dt>
                <dd>{item.region}</dd>
              </div>

              <div>
                <dt>LGA</dt>
                <dd>
                  {
                    item.localGovernmentArea
                  }
                </dd>
              </div>

              <div>
                <dt>
                  Cultural Group
                </dt>
                <dd>
                  {
                    item.ethnicGroup
                  }
                </dd>
              </div>

              <div>
                <dt>Time</dt>
                <dd>
                  {item.startMonth} –{" "}
                  {item.endMonth}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>
    </>
  );
}

/* ----------------------------------
   ABOUT
---------------------------------- */

export function About() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSiteSettings()
      .then(setSettings)
      .catch(() => setSettings({}));
  }, []);

  if (!settings) {
    return <PageLoading text="Loading About Us…" />;
  }

  const youtubeUrl = String(
    settings.youtubeChannelUrl || ""
  ).trim();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Who We Are</span>

          <h1 className="heading">
            {settings.aboutTitle || "About Moji's Heritage"}
          </h1>

          <p>
            Discover our purpose, vision, mission and commitment to
            preserving and sharing Nigerian cultural heritage.
          </p>
        </div>
      </section>

      <section className="container section prose">
        <div className="about-markdown">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {String(settings.aboutBody || "")}
  </ReactMarkdown>
</div>

        <div className="mission-grid">
          <div className="card card-body">
            <span className="eyebrow">Vision</span>

            <h2 className="heading">Our Vision</h2>

            <p>
              {settings.vision ||
                "Our vision will be published here soon."}
            </p>
          </div>

          <div className="card card-body">
            <span className="eyebrow">Mission</span>

            <h2 className="heading">Our Mission</h2>

            <p>
              {settings.mission ||
                "Our mission will be published here soon."}
            </p>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="card card-body">
          <span className="eyebrow">Connect With Us</span>

          <h2 className="heading">
            Have Something to Share?
          </h2>

          <p>
            Moji's Heritage welcomes cultural stories, corrections,
            historical contributions, research enquiries, partnership
            proposals and other enquiries relating to Nigerian heritage.
          </p>

          <p>
            Use our Contact Us page to send your message directly to
            the Moji's Heritage team.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginTop: "1rem",
            }}
          >
            <Link className="btn primary" to="/contact">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {youtubeUrl && (
        <section className="container section">
          <div className="card card-body">
            <span className="eyebrow">Watch & Discover</span>

            <h2 className="heading">
              Heritage Through Documentary Storytelling
            </h2>

            <p>
              Continue exploring Nigerian history, traditions,
              communities and cultural stories through our documentary
              content on YouTube.
            </p>

            <div style={{ marginTop: "1rem" }}>
              <a
                className="btn earth"
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Explore Our YouTube Channel
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
/* ----------------------------------
   PRIVACY
---------------------------------- */

export function Privacy() {
  const { openPreferencesManager } =
    useConsent();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">
            Your Privacy
          </span>

          <h1 className="heading">
            Privacy Policy
          </h1>

          <p>
            How Moji&apos;s Heritage handles
            information submitted through
            public website features, browser
            storage and connected services.
          </p>
        </div>
      </section>

      <section className="container section prose">
        <h2 className="heading">
          Public Access
        </h2>

        <p>
          Moji&apos;s Heritage is designed for
          public learning. Visitors do not
          need to create an account to
          read stories, explore cultural
          places, search the website or
          use public features.
        </p>

        <h2 className="heading">
          Comments
        </h2>

        <p>
          When you submit a comment on a story,
          we receive the display name (up to 60
          characters) and comment text (up to
          1,000 characters) you provide, along
          with the story identifier and submission
          timestamp. Comments are stored in
          Google Firebase Firestore with{" "}
          <code>isApproved: false</code> and are
          reviewed by an administrator before
          public display. Please do not include
          sensitive personal information in
          public comments.
        </p>

        <h2 className="heading">
          Contact Form
        </h2>

        <p>
          When you submit the Contact Us form,
          your name, email address, reason for
          contact, subject and message are
          transmitted via the Web3Forms delivery
          service (<code>api.web3forms.com</code>)
          so the Moji&apos;s Heritage team can
          read and respond to your enquiry.
          Contact messages are not displayed
          publicly on the website.
        </p>

        <h2 className="heading">
          Browser Storage &amp; Preferences
        </h2>

        <p>
          Moji&apos;s Heritage uses browser{" "}
          <code>localStorage</code> on your
          device rather than advertising or
          cross-site tracking cookies:
        </p>

        <ul>
          <li>
            <strong>
              Consent Preferences (<code>{CONSENT_STORAGE_KEY}</code>):
            </strong>{" "}
            Strictly necessary storage that records
            whether you accepted or rejected optional
            storage categories, along with the policy
            version and timestamp.
          </li>
          <li>
            <strong>
              Theme Selection (<code>{THEME_STORAGE_KEY}</code>):
            </strong>{" "}
            Remembers whether you selected the{" "}
            <em>Archives</em> (light) or{" "}
            <em>Gallery Noir</em> (dark) visual theme.
          </li>
          <li>
            <strong>
              Saved Stories (<code>{SAVED_POSTS_KEY}</code>):
            </strong>{" "}
            Stores story IDs when you explicitly click
            the Save / Bookmark button on an article.
            You can clear this list at any time on the{" "}
            <Link to="/saved" className="text-link">
              Saved Stories
            </Link>{" "}
            page.
          </li>
          <li>
            <strong>
              Recently Viewed Stories (<code>{RECENTLY_VIEWED_KEY}</code>):
            </strong>{" "}
            Optional preference storage that remembers
            up to 6 recently opened stories in your
            browser. This feature is disabled by
            default until you enable{" "}
            <em>Preferences &amp; Reading History</em>{" "}
            in our storage controls, and is erased
            immediately if you withdraw consent.
          </li>
        </ul>

        <p>
          For full technical details, see our{" "}
          <Link to="/cookies" className="text-link">
            Cookie &amp; Storage Policy
          </Link>
          .
        </p>

        <h2 className="heading">
          Firebase &amp; Measurement Services
        </h2>

        <p>
          The website uses Google Firebase
          services (Firebase Hosting, Cloud
          Firestore, Firebase Authentication for
          authorised administrators, and Firebase
          Storage where configured). If you enable
          optional{" "}
          <em>Analytics &amp; Story View Measurement</em>
          , opening an article increments an
          aggregate view counter on that story
          document in Firestore. We do not use
          third-party advertising networks or
          behavioral profiling scripts.
        </p>

        <h2 className="heading">
          Security &amp; Abuse Prevention
        </h2>

        <p>
          Where configured, Firebase App Check
          (using reCAPTCHA Enterprise) and
          standard hosting security logs may
          process technical request metadata to
          protect the website against spam,
          automated abuse and unauthorised
          access.
        </p>

        <h2 className="heading">
          External Services
        </h2>

        <p>
          Links to YouTube, social sharing links
          (WhatsApp, Facebook, X) and interactive
          map tiles from OpenStreetMap (loaded
          when you switch to Map View on the Visit
          page) connect to third-party services
          governed by their own terms and privacy
          policies.
        </p>

        <h2 className="heading">
          Managing Your Choices &amp; Questions
        </h2>

        <p>
          You can review, change or withdraw your
          optional storage and measurement
          preferences at any time using the button
          below or the persistent link in the
          website footer. For privacy questions or
          requests regarding submitted comments or
          messages, please use our{" "}
          <Link to="/contact" className="text-link">
            Contact Us
          </Link>{" "}
          page.
        </p>

        <div className="hero-actions">
          <button
            type="button"
            className="btn primary"
            onClick={openPreferencesManager}
          >
            Manage Cookie &amp; Storage Preferences
          </button>

          <Link to="/cookies" className="btn outline">
            Read Cookie &amp; Storage Policy
          </Link>

          <Link to="/contact" className="btn outline">
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}

/* ----------------------------------
   COOKIE & STORAGE POLICY
---------------------------------- */

export function CookiePolicy() {
  const {
    choices,
    hasDecided,
    updatedAt,
    openPreferencesManager,
    rejectOptional
  } = useConsent();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">
            Transparency &amp; Controls
          </span>

          <h1 className="heading">
            Cookie &amp; Browser Storage Policy
          </h1>

          <p>
            Plain-language documentation of how
            Moji&apos;s Heritage uses browser local
            storage, security tokens and optional
            measurement features.
          </p>
        </div>
      </section>

      <section className="container section prose">
        <h2 className="heading">
          How We Use Browser Storage
        </h2>

        <p>
          Moji&apos;s Heritage primarily uses your
          browser&apos;s <code>localStorage</code>{" "}
          mechanism to store settings on your own
          device. Unlike tracking cookies sent to
          advertising servers on every request,{" "}
          <code>localStorage</code> items remain in
          your browser unless you clear them or
          change your preferences.
        </p>

        <div className="card card-body" style={{ marginBlock: "1.5rem" }}>
          <span className="mono-eyebrow">CURRENT BROWSER STATUS</span>
          <h3 className="heading" style={{ marginTop: "0.35rem" }}>
            Your Active Preference State
          </h3>
          <p className="muted" style={{ marginBottom: "0.75rem" }}>
            Status:{" "}
            <strong>
              {hasDecided
                ? "Preferences saved"
                : "No optional categories enabled (default)"}
            </strong>
            {updatedAt && (
              <> · Updated {new Date(updatedAt).toLocaleString()}</>
            )}
          </p>
          <ul>
            <li>
              Strictly Necessary Storage: <strong>Active</strong>
            </li>
            <li>
              Preferences &amp; Reading History:{" "}
              <strong>{choices.preferences ? "Enabled" : "Disabled"}</strong>
            </li>
            <li>
              Analytics &amp; Story View Measurement:{" "}
              <strong>{choices.analytics ? "Enabled" : "Disabled"}</strong>
            </li>
            <li>
              Marketing &amp; Advertising:{" "}
              <strong>{choices.marketing ? "Enabled" : "Disabled (Not Used)"}</strong>
            </li>
          </ul>
          <div className="hero-actions">
            <button
              type="button"
              className="btn primary"
              onClick={openPreferencesManager}
            >
              Open Preferences Editor
            </button>
            {hasDecided && (choices.preferences || choices.analytics || choices.marketing) && (
              <button
                type="button"
                className="btn outline"
                onClick={rejectOptional}
              >
                Withdraw Optional Consent
              </button>
            )}
          </div>
        </div>

        <h2 className="heading">
          Storage Inventory
        </h2>

        <ul>
          <li>
            <strong>
              <code>{CONSENT_STORAGE_KEY}</code> (Strictly Necessary):
            </strong>{" "}
            Stores your consent choices, policy version
            and timestamp in <code>localStorage</code> so
            the consent banner does not reappear on every
            page view.
          </li>
          <li>
            <strong>
              <code>{THEME_STORAGE_KEY}</code> (Strictly Necessary / User-Requested):
            </strong>{" "}
            Stores your chosen visual mode (
            <code>archives</code> or <code>noir</code>)
            when you use the theme toggle in the
            navigation bar.
          </li>
          <li>
            <strong>
              <code>{SAVED_POSTS_KEY}</code> (Strictly Necessary / User-Requested):
            </strong>{" "}
            Stores an array of article IDs when you click
            the bookmark button to save a story for later
            reading.
          </li>
          <li>
            <strong>
              <code>{RECENTLY_VIEWED_KEY}</code> (Optional — Preferences):
            </strong>{" "}
            Stores up to 6 recently viewed story summaries
            on your device. Disabled by default until you
            grant <em>Preferences &amp; Reading History</em>{" "}
            consent.
          </li>
          <li>
            <strong>
              Firebase Auth &amp; App Check Storage (Strictly Necessary where used):
            </strong>{" "}
            Used only when an authorised administrator
            signs in to <code>/admin</code> or when
            Firebase App Check is configured to protect
            public forms against automated abuse.
          </li>
        </ul>

        <h2 className="heading">
          Questions or Concerns
        </h2>

        <p>
          If you have any questions about our{" "}
          <Link to="/privacy" className="text-link">
            Privacy Policy
          </Link>{" "}
          or this Cookie &amp; Browser Storage
          Policy, please reach out through our{" "}
          <Link to="/contact" className="text-link">
            Contact Us
          </Link>{" "}
          page.
        </p>
      </section>
    </>
  );
}

/* ----------------------------------
   CONTACT
---------------------------------- */

export function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    reason: "General enquiry",
    subject: "",
    note: "",
  });

  const [state, setState] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    setState("sending");
    setErrorMessage("");

    const accessKey =
      import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

    if (!accessKey) {
      setState("error");
      setErrorMessage(
        "The contact form is not configured yet."
      );
      return;
    }

    try {
      const response = await fetch(
        "https://api.web3forms.com/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            access_key: accessKey,

            name: form.name,
            email: form.email,

            subject:
              form.subject ||
              `Moji's Heritage — ${form.reason}`,

            reason: form.reason,

            message: form.note,

            from_name: "Moji's Heritage Website",

            botcheck: "",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Your message could not be sent."
        );
      }

      setState("sent");

      setForm({
        name: "",
        email: "",
        reason: "General enquiry",
        subject: "",
        note: "",
      });
    } catch (error) {
      console.error("Contact form error:", error);

      setState("error");

      setErrorMessage(
        error?.message ||
          "Unable to send your message. Please try again."
      );
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">
            Contact Us
          </span>

          <h1 className="heading">
            Talk to Moji's Heritage
          </h1>

          <p>
            Contact us about research, cultural
            corrections, discoveries, festivals,
            partnerships, media enquiries or other
            matters relating to Nigerian heritage.
          </p>
        </div>
      </section>

      <section className="container section">
        <div className="contact-layout">
          <div>
            {state === "sent" && (
              <div className="success">
                Your message has been sent successfully.
                Thank you for contacting Moji's Heritage.
              </div>
            )}

            {state === "error" && (
              <div className="danger">
                {errorMessage}
              </div>
            )}

            <form
              className="form card card-body contact-form"
              onSubmit={submit}
            >
              <div className="field">
                <label htmlFor="contact-name">
                  Name *
                </label>

                <input
                  id="contact-name"
                  type="text"
                  required
                  maxLength={80}
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="contact-email">
                  Email *
                </label>

                <input
                  id="contact-email"
                  type="email"
                  required
                  maxLength={160}
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="contact-reason">
                  Why are you contacting us? *
                </label>

                <select
                  id="contact-reason"
                  required
                  value={form.reason}
                  onChange={(event) =>
                    updateField(
                      "reason",
                      event.target.value
                    )
                  }
                >
                  <option value="General enquiry">
                    General enquiry
                  </option>

                  <option value="Historical or cultural correction">
                    Historical or cultural correction
                  </option>

                  <option value="New heritage discovery">
                    New heritage discovery
                  </option>

                  <option value="Festival or event information">
                    Festival or event information
                  </option>

                  <option value="Research collaboration">
                    Research collaboration
                  </option>

                  <option value="Partnership">
                    Partnership
                  </option>

                  <option value="Media enquiry">
                    Media enquiry
                  </option>

                  <option value="Content contribution">
                    Content contribution
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="contact-subject">
                  Subject
                </label>

                <input
                  id="contact-subject"
                  type="text"
                  maxLength={140}
                  placeholder="What is your message about?"
                  value={form.subject}
                  onChange={(event) =>
                    updateField(
                      "subject",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="contact-message">
                  Message *
                </label>

                <textarea
                  id="contact-message"
                  required
                  minLength={10}
                  maxLength={3000}
                  rows={8}
                  placeholder="Write your message here..."
                  value={form.note}
                  onChange={(event) =>
                    updateField(
                      "note",
                      event.target.value
                    )
                  }
                />
              </div>

              {/* Spam trap — real visitors never use this */}
              <input
                type="checkbox"
                name="botcheck"
                tabIndex="-1"
                autoComplete="off"
                style={{ display: "none" }}
              />

              <button
                className="btn primary"
                type="submit"
                disabled={state === "sending"}
              >
                {state === "sending"
                  ? "Sending..."
                  : "Send Message"}
              </button>

              <p className="muted">
                Please provide a valid email address so
                the Moji's Heritage team can respond to
                your enquiry when necessary.
              </p>
            </form>
          </div>

          <aside className="card card-body">
            <span className="eyebrow">
              Get in Touch
            </span>

            <h2 className="heading">
              Help Us Document Heritage Responsibly
            </h2>

            <p>
              Moji's Heritage welcomes contributions from
              researchers, historians, cultural
              practitioners, communities, travellers and
              members of the public.
            </p>

            <p>
              If you notice historical information that
              needs clarification or correction, please
              include as much context as possible in your
              message.
            </p>

            <p>
              You can also contact us about festivals,
              heritage destinations, collaborations,
              documentary ideas and cultural discoveries.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}

/* ----------------------------------
   404
---------------------------------- */

export function NotFound({
  customTitle
}) {
  return (
    <section className="container not-found">
      <span className="not-found-number">
        404
      </span>

      <h1 className="heading">
        {customTitle ||
          "This heritage story could not be found."}
      </h1>

      <p className="muted">
        The page may have moved, the
        address may be incorrect, or the
        content may no longer be
        available.
      </p>

      <div className="not-found-actions">
        <Link
          to="/"
          className="btn primary"
        >
          Return Home
        </Link>

        <Link
          to="/search"
          className="btn outline"
        >
          Search Moji's Heritage
        </Link>
      </div>
    </section>
  );
}

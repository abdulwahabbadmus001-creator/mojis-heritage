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
  getCultureBySlug,
  NIGERIAN_STATES_AND_FCT,
  HISTORICAL_PERIODS,
  ARTIFACT_CLASSIFICATIONS
} from "../data/cultures";

import {
  enrichRecordWithKnowledgeGraph,
  getKnowledgeGraphConnections
} from "../data/knowledgeGraph";

import {
  getPublicExternalDiscoveries,
  mapExternalDiscoveryToPost
} from "../services/externalDiscovery";

import {
  CONTRIBUTION_CONTENT_TYPES,
  createPublicSubmission,
  submitCorrectionOrWithdrawalRequest,
  validateAttachmentFileMeta
} from "../services/contributions";

import {
  Share,
  EmptyState,
  PageLoading
} from "../components/Site";

import {
  readingTime
} from "../utils/readingTime";

import {
  sanitizeHttpUrl
} from "../utils/urlSafety";

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
    era: "c. 1500 BCE – 200 CE • CENTRAL NIGERIA",
    periodLabel: "ERA I · ARCHAEOLOGICAL RECORD",
    title: "01. The Nok Terracotta & Early Iron Tradition",
    summary:
      "Archaeological excavations across central Nigeria (first identified near Nok village in Kaduna State in 1928) have uncovered large-scale coil-built terracotta sculptures alongside early iron-smelting furnaces dated between the first millennium BCE and second century CE.",
    material: "Coarse-grained Fired Clay & Iron Slag",
    provenanceContext: "Central Nigeria (Kaduna & Benue Valleys) · Ref: NCMM / Breunig (2014)",
    custodian: "National Museum Jos & National Museum Kaduna (NCMM Nigeria)",
    licence: "Open Educational Reference · Cited NCMM Archaeological Dossier",
    focalPoint: "center 24%",
    zoomScale: 1.0,
    detailCallout: "Illustrative Plate · Nok-era terracotta & ironworking scholarship",
    image:
      "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=1400&q=80",
    storyLink: "/histories",
    annotations: [
      {
        id: "nok-eye",
        x: 46,
        y: 34,
        label: "Triangular Perforated Eye Motif",
        detail: "Characteristic Nok sculptural convention with incised brow arches and pierced pupils allowing air vent during firing."
      },
      {
        id: "nok-coil",
        x: 58,
        y: 66,
        label: "Coiled Grog-Tempered Clay",
        detail: "Hand-built from local alluvial clay mixed with crushed quartz temper for thermal resilience."
      }
    ]
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
    custodian: "National Museum Lagos & Enugu (NCMM Nigeria)",
    licence: "Open Educational Reference · Cited Shaw (1970) Excavation Archive",
    focalPoint: "center 45%",
    zoomScale: 1.18,
    detailCallout: "Illustrative Plate · Igbo-Ukwu bronze-casting & Nri ritual context",
    image:
      "https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=1400&q=80",
    storyLink: "/post/ozo",
    annotations: [
      {
        id: "igbo-ropework",
        x: 48,
        y: 44,
        label: "Cire-Perdue Knotted Ropework",
        detail: "Cast in thin-walled leaded bronze with delicate wax-thread relief knots enclosing the ritual water vessel."
      },
      {
        id: "igbo-alloy",
        x: 64,
        y: 62,
        label: "Indigenous Lead-Copper-Tin Ore",
        detail: "Isotopic analysis links the alloy to ancient Abakaliki / Benue trough矿 ore deposits in southeastern Nigeria."
      }
    ]
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
    custodian: "National Museum Ilé-Ifẹ̀, Osun State (NCMM Nigeria)",
    licence: "Open Educational Reference · Cited Willett (1967) & NCMM",
    focalPoint: "center 18%",
    zoomScale: 1.26,
    detailCallout: "Illustrative Plate · Classical Ilé-Ifẹ̀ portraiture & facial striations",
    image:
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1400&q=80",
    storyLink: "/cultures/yoruba",
    annotations: [
      {
        id: "ife-striation",
        x: 44,
        y: 38,
        label: "Fine Vertical Facial Striations",
        detail: "Parallel scarification lines (ikọlẹ) rendered with sub-millimetre precision across the serene portrait visage."
      },
      {
        id: "ife-crown",
        x: 52,
        y: 22,
        label: "Are Royal Diadem Plume Socket",
        detail: "Perforations along the hairline anchored glass and stone bead regalia worn by the Ooni of Ife."
      }
    ]
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
    custodian: "Oba of Benin Royal Court & National Museum Benin City",
    licence: "Open Educational Reference · Digital Benin & NCMM Restitution Dossier",
    focalPoint: "center 35%",
    zoomScale: 1.12,
    detailCallout: "Illustrative Plate · Benin court guild traditions & historical memory",
    image:
      "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1400&q=80",
    storyLink: "/post/benin",
    annotations: [
      {
        id: "benin-coral",
        x: 50,
        y: 36,
        label: "Ododo High Coral Bead Collar",
        detail: "Multi-strand Mediterranean red coral regalia signifying court rank under the Oba of Benin."
      },
      {
        id: "benin-foil",
        x: 70,
        y: 52,
        label: "Ebe-Amen Quatrefoil River-Leaf",
        detail: "Punched background motif honouring Olokun, lord of the great waters and wealth."
      }
    ]
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

  const [artifactPan, setArtifactPan] =
    useState({ x: 0, y: 0 });

  const [activeAnnotationId, setActiveAnnotationId] =
    useState(null);

  const [viewerFullscreen, setViewerFullscreen] =
    useState(false);

  const [viewerImgError, setViewerImgError] =
    useState(false);

  const [externalDiscoveries, setExternalDiscoveries] =
    useState([]);

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

    getPublicExternalDiscoveries()
      .then(setExternalDiscoveries)
      .catch(() => setExternalDiscoveries([]));
  }, []);

  useEffect(() => {
    setArtifactPan({ x: 0, y: 0 });
    setActiveAnnotationId(null);
    setViewerImgError(false);
  }, [activeChapterId]);

  useEffect(() => {
    if (!viewerFullscreen) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setViewerFullscreen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewerFullscreen]);

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

                <div className="split-zoom-controls" role="group" aria-label="Artifact Zoom and Pan Controls">
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
                      setArtifactZoom((z) => Math.min(1.65, +(z + 0.15).toFixed(2)))
                    }
                    aria-label="Zoom in artifact"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="zoom-btn"
                    onClick={() =>
                      setArtifactPan((p) => ({ ...p, x: Math.max(-45, p.x - 15) }))
                    }
                    aria-label="Pan artifact left"
                    title="Pan left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="zoom-btn"
                    onClick={() =>
                      setArtifactPan((p) => ({ ...p, x: Math.min(45, p.x + 15) }))
                    }
                    aria-label="Pan artifact right"
                    title="Pan right"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className="zoom-btn"
                    onClick={() => {
                      setArtifactZoom(1);
                      setArtifactPan({ x: 0, y: 0 });
                    }}
                    aria-label="Reset zoom and pan"
                    title="Reset view"
                  >
                    ⟲
                  </button>
                  <button
                    type="button"
                    className="zoom-btn"
                    onClick={() => setViewerFullscreen(true)}
                    aria-label="Open fullscreen artifact inspection"
                    title="Fullscreen inspection"
                  >
                    ⤢
                  </button>
                </div>
              </div>

              <div className="split-stage-viewport" style={{ position: "relative" }}>
                {!viewerImgError ? (
                  <img
                    src={activeChapter.image}
                    alt={activeChapter.title}
                    loading="lazy"
                    onError={() => setViewerImgError(true)}
                    style={{
                      objectPosition: activeChapter.focalPoint,
                      transform: `scale(${(
                        activeChapter.zoomScale * artifactZoom
                      ).toFixed(2)}) translate(${artifactPan.x}px, ${artifactPan.y}px)`
                    }}
                    className="split-stage-image"
                  />
                ) : (
                  <div
                    className="split-stage-fallback"
                    style={{
                      minHeight: 320,
                      display: "grid",
                      placeItems: "center",
                      padding: "2rem",
                      textAlign: "center"
                    }}
                  >
                    <p>
                      Archival plate preview temporarily unavailable. Provenance
                      and material notes remain accessible below.
                    </p>
                  </div>
                )}

                {Array.isArray(activeChapter.annotations) &&
                  activeChapter.annotations.map((pin, idx) => {
                    const isPinOpen = activeAnnotationId === pin.id;
                    return (
                      <button
                        key={pin.id}
                        type="button"
                        aria-label={`Inspect annotation: ${pin.label}`}
                        aria-expanded={isPinOpen}
                        onClick={() =>
                          setActiveAnnotationId(isPinOpen ? null : pin.id)
                        }
                        style={{
                          position: "absolute",
                          left: `${pin.x}%`,
                          top: `${pin.y}%`,
                          transform: "translate(-50%, -50%)",
                          width: 30,
                          height: 30,
                          borderRadius: "999px",
                          border: "2px solid #f5d08a",
                          background: isPinOpen
                            ? "#c89d54"
                            : "rgba(12, 11, 10, 0.82)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          zIndex: 4
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}

                <div className="split-stage-callout glass-noir">
                  <span className="mono-eyebrow">
                    {activeAnnotationId
                      ? "CURATORIAL ANNOTATION PIN"
                      : "STAGE VIEWPORT NOTE"}
                  </span>
                  <strong>
                    {activeAnnotationId
                      ? activeChapter.annotations?.find(
                          (a) => a.id === activeAnnotationId
                        )?.label
                      : activeChapter.detailCallout}
                  </strong>
                  {activeAnnotationId && (
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.84rem" }}>
                      {
                        activeChapter.annotations?.find(
                          (a) => a.id === activeAnnotationId
                        )?.detail
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* Thumbnail Switcher */}
              <div
                role="tablist"
                aria-label="Artifact Era Thumbnail Switcher"
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginTop: "0.75rem",
                  overflowX: "auto"
                }}
              >
                {HERITAGE_TIMELINE_CHAPTERS.map((thumb) => {
                  const selected = thumb.id === activeChapter.id;
                  return (
                    <button
                      key={thumb.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActiveChapterId(thumb.id)}
                      className={
                        selected ? "glass-pill-noir" : "lighting-btn"
                      }
                      style={{
                        fontSize: "0.76rem",
                        padding: "0.35rem 0.7rem",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {thumb.title.replace(/^\d+\.\s*/, "")}
                    </button>
                  );
                })}
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
                <div>
                  <dt>CUSTODIAN &amp; RIGHTS</dt>
                  <dd>
                    {activeChapter.custodian} · {activeChapter.licence}
                  </dd>
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

        {viewerFullscreen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Fullscreen inspection: ${activeChapter.title}`}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(8, 8, 7, 0.94)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "1.5rem"
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 1080,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                color: "#f5f2eb"
              }}
            >
              <div>
                <span className="mono-eyebrow">{activeChapter.era}</span>
                <h3 className="heading" style={{ margin: 0, color: "#fff" }}>
                  {activeChapter.title}
                </h3>
              </div>
              <button
                type="button"
                className="btn earth"
                onClick={() => setViewerFullscreen(false)}
              >
                Exit Fullscreen (Esc)
              </button>
            </div>
            <img
              src={activeChapter.image}
              alt={activeChapter.title}
              style={{
                maxWidth: "92vw",
                maxHeight: "74vh",
                objectFit: "contain",
                borderRadius: 14,
                border: "1px solid rgba(212, 163, 89, 0.35)"
              }}
            />
            <p
              style={{
                color: "#d9d2c5",
                maxWidth: 780,
                textAlign: "center",
                marginTop: "0.85rem",
                fontSize: "0.92rem"
              }}
            >
              {activeChapter.material} · {activeChapter.provenanceContext} ·{" "}
              {activeChapter.licence}
            </p>
          </div>
        )}
      </section>

      {/* ============================================================
          EXTERNAL OPEN-ACCESS COLLECTIONS & NEWLY DISCOVERED HERITAGE
      ============================================================ */}
      {externalDiscoveries.length > 0 && (
        <section
          className="container section"
          aria-labelledby="external-collections-heading"
        >
          <SectionHeading
            eyebrow="Open-Access Museum & Archival Integrations"
            title="External Collections & Newly Discovered Nigerian Heritage"
            text="Verified open-access Nigerian artifacts and cultural records synchronized from The Metropolitan Museum of Art Open Access API and Wikipedia/Wikimedia Heritage Archives."
            link="/search?source=external"
            linkLabel="Filter external collections"
          />

          <div id="external-collections-heading" className="grid cards">
            {externalDiscoveries.slice(0, 3).map((item) => (
              <article className="card" key={item.id}>
                {item.coverImage && (
                  <div className="card-media">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span className="card-badge">
                      External Discovery · {item.providerName}
                    </span>
                  </div>
                )}
                <div className="card-body">
                  <div className="card-meta">
                    <span className="tag soft">{item.ethnicGroup}</span>
                    {item.state && <span>{item.state} State</span>}
                  </div>
                  <h3 className="heading card-title">{item.title}</h3>
                  <p className="muted card-summary">{item.summary}</p>
                  <small
                    className="muted"
                    style={{ display: "block", marginBottom: "0.75rem" }}
                  >
                    <strong>Custodian:</strong> {item.custodian}
                    {item.accessionNumber
                      ? ` (${item.accessionNumber})`
                      : ""}{" "}
                    · <strong>Licence:</strong> {item.licence}
                  </small>
                  <div className="card-actions">
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link"
                    >
                      Inspect Source Record ↗
                    </a>
                    <Link
                      to={`/search?q=${encodeURIComponent(item.ethnicGroup || "Nigeria")}`}
                      className="text-link"
                    >
                      Related Archive →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================
          CONTRIBUTE TO THE ARCHIVE CALL TO ACTION
      ============================================================ */}
      <section className="container section">
        <div className="visit-cta">
          <div>
            <span className="eyebrow light">
              Community & Scholarly Contributions
            </span>
            <h2 className="heading">
              Contribute to Nigeria&apos;s Digital Cultural Archive
            </h2>
            <p>
              Historians, custodians, researchers, and community members can
              submit artifact documentation, oral histories, festival records,
              indigenous terminology, or source citations. Every submission is
              reviewed privately by Moji&apos;s Heritage administrators before
              publication.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link className="btn earth" to="/contribute">
                Contribute to the Archive
              </Link>
              <Link
                className="btn hero-outline"
                to="/contribute?tab=correction"
              >
                Submit a Correction or Citation
              </Link>
            </div>
          </div>
          <div className="visit-preview">
            <Link to="/contribute">
              <span>
                <strong>1. Submit with Sources &amp; Rights</strong>
                <small>
                  Include state, community, period, and attribution preference
                </small>
              </span>
            </Link>
            <Link to="/contribute">
              <span>
                <strong>2. Private Curatorial Review</strong>
                <small>
                  Pending records remain strictly private until approved
                </small>
              </span>
            </Link>
            <Link to="/contribute">
              <span>
                <strong>3. Verified Publication</strong>
                <small>
                  Published with full contributor credit &amp; provenance badge
                </small>
              </span>
            </Link>
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
  const [externalRecords, setExternalRecords] =
    useState([]);

  const culture =
    getCultureBySlug(slug);

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch(() => setPosts([]));

    getPublicExternalDiscoveries()
      .then(setExternalRecords)
      .catch(() => setExternalRecords([]));
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

  const relatedExternal =
    externalRecords.filter((ext) => {
      const group = normalise(ext.ethnicGroup);
      const cultureName = normalise(culture.name);
      const cultureSlug = normalise(culture.slug);
      return (
        (group &&
          (group.includes(cultureName) ||
            cultureName.includes(group) ||
            group.includes(cultureSlug))) ||
        (ext.state &&
          Array.isArray(culture.states) &&
          culture.states.some((st) => normalise(st) === normalise(ext.state)))
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
        {/* Connected Nigerian Cultural Knowledge Graph Profile */}
        <div
          className="grid cards"
          style={{ marginBottom: "2.25rem" }}
          aria-label={`${culture.name} Cultural Knowledge Graph`}
        >
          {Array.isArray(culture.kingdomsAndInstitutions) &&
            culture.kingdomsAndInstitutions.length > 0 && (
              <div className="card card-body">
                <span className="eyebrow">Kingdoms &amp; Institutions</span>
                <h3 className="heading">Historic Polities &amp; Custodians</h3>
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem" }}>
                  {culture.kingdomsAndInstitutions.map((item) => (
                    <li key={item} style={{ marginBottom: "0.35rem" }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {Array.isArray(culture.notableTraditions) &&
            culture.notableTraditions.length > 0 && (
              <div className="card card-body">
                <span className="eyebrow">Material &amp; Living Heritage</span>
                <h3 className="heading">Notable Traditions &amp; Arts</h3>
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem" }}>
                  {culture.notableTraditions.map((item) => (
                    <li key={item} style={{ marginBottom: "0.35rem" }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {Array.isArray(culture.keyFigures) &&
            culture.keyFigures.length > 0 && (
              <div className="card card-body">
                <span className="eyebrow">People &amp; Custodians</span>
                <h3 className="heading">Key Historical Figures</h3>
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem" }}>
                  {culture.keyFigures.map((item) => (
                    <li key={item} style={{ marginBottom: "0.35rem" }}>
                      {item}
                    </li>
                  ))}
                </ul>
                {Array.isArray(culture.languages) &&
                  culture.languages.length > 0 && (
                    <p
                      className="muted"
                      style={{ marginTop: "0.75rem", fontSize: "0.88rem" }}
                    >
                      <strong>Languages / Dialects:</strong>{" "}
                      {culture.languages.join(", ")}
                    </p>
                  )}
              </div>
            )}
        </div>

        {related.length === 0 && relatedExternal.length === 0 && (
          <EmptyState
            title={`The ${culture.name} collection is growing`}
            text="Contribute verified artifact records, oral histories, or festival descriptions for administrator review."
            action="/contribute"
            actionLabel={`Contribute ${culture.name} Heritage`}
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

        {relatedExternal.length > 0 && (
          <section className="culture-section" style={{ marginTop: "2.5rem" }}>
            <SectionHeading
              eyebrow="External Open-Access Discovery"
              title={`Verified Museum & Archive Records (${culture.name})`}
              text={`Open-access Nigerian cultural heritage records connected to ${culture.name} and associated states, attributed to their custodian institutions.`}
            />

            <div className="grid cards">
              {relatedExternal.map((ext) => (
                <article key={ext.id} className="card post-card">
                  {ext.coverImage && (
                    <Link to={`/post/${ext.id}`} className="post-image-link">
                      <img
                        loading="lazy"
                        src={ext.coverImage}
                        alt={ext.title}
                        className="post-card-image"
                      />
                    </Link>
                  )}
                  <div className="card-body">
                    <div className="post-card-tags">
                      <span className="tag">
                        External Discovery · {ext.providerName}
                      </span>
                      {ext.state && <span className="tag soft">{ext.state}</span>}
                    </div>

                    <h3 className="heading post-card-title">
                      <Link to={`/post/${ext.id}`}>{ext.title}</Link>
                    </h3>

                    <p className="muted">{ext.summary}</p>

                    <div className="post-card-meta">
                      <span>{ext.classification || "Museum Artifact"}</span>
                      <span>{ext.licence}</span>
                    </div>

                    <div className="post-card-actions" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
                      <Link className="btn primary" to={`/post/${ext.id}`}>
                        Open Archival Dossier
                      </Link>
                      {ext.sourceUrl && (
                        <a
                          className="btn outline"
                          href={ext.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Museum Source ↗
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
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
    Promise.all([getPosts(), getPublicExternalDiscoveries()])
      .then(([posts, externalRecords]) => {
        setAllPosts(posts);

        const foundPost =
          posts.find(
            (item) =>
              item.id === id
          );

        if (foundPost) {
          setPost(foundPost);
          bumpView(id);
          addRecentlyViewed(foundPost);
          return;
        }

        const foundExternal = (externalRecords || []).find(
          (item) => item.id === id
        );
        if (foundExternal) {
          const mappedExternal = mapExternalDiscoveryToPost(foundExternal);
          setPost(mappedExternal);
          addRecentlyViewed(mappedExternal);
          return;
        }

        setPost(null);
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

  const enrichedPost = enrichRecordWithKnowledgeGraph(post);
  const kgConnections = getKnowledgeGraphConnections(
    enrichedPost,
    allPosts,
    []
  );

  const related =
    kgConnections.relatedArtifactsAndStories.length > 0
      ? kgConnections.relatedArtifactsAndStories.slice(0, 3)
      : allPosts
          .filter(
            (item) =>
              item.id !== post.id &&
              (item.category === post.category ||
                item.ethnicGroup === post.ethnicGroup)
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

            {enrichedPost.ethnicGroup && (
              <span className="tag soft">
                {enrichedPost.ethnicGroup}
              </span>
            )}

            {enrichedPost.state && (
              <span className="tag soft">
                {enrichedPost.state}
              </span>
            )}

            <span className="tag soft">
              {enrichedPost.sourceLabel || "Verified Moji's Heritage Publication"}
            </span>
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
            src={sanitizeHttpUrl(post.coverImage, "", { allowRelative: true })}
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
                  a: ({ node, href, ...props }) => (
                    <a
                      {...props}
                      href={sanitizeHttpUrl(href, "#", { allowRelative: true })}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                  img: ({ node, src, alt, ...props }) => {
                    const safeSrc = sanitizeHttpUrl(src, "", { allowRelative: true });
                    return safeSrc ? (
                      <img {...props} src={safeSrc} alt={alt || ""} loading="lazy" />
                    ) : null;
                  }
                }}
              >
                {String(post.body || "")}
              </ReactMarkdown>
            </div>

            {sanitizeHttpUrl(post.youtubeUrl, "") && (
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
                  href={sanitizeHttpUrl(post.youtubeUrl, "#")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Watch on YouTube
                </a>
              </div>
            )}

            {/* Provenance Timeline & Indigenous Lexicon */}
            {Array.isArray(enrichedPost.provenanceEvents) &&
              enrichedPost.provenanceEvents.length > 0 && (
                <section
                  className="card card-body"
                  style={{ marginTop: "2rem" }}
                  aria-label="Provenance and Historical Chronology"
                >
                  <span className="eyebrow">Provenance &amp; Chronology</span>
                  <h3 className="heading">Documented Historical Timeline</h3>
                  <div style={{ display: "grid", gap: "0.85rem", marginTop: "0.75rem" }}>
                    {enrichedPost.provenanceEvents.map((evt, idx) => (
                      <div
                        key={idx}
                        style={{
                          paddingLeft: "0.85rem",
                          borderLeft: "3px solid var(--gold-primary, #c89d54)"
                        }}
                      >
                        <strong>
                          {evt.era} — {evt.title}
                        </strong>
                        <p style={{ margin: "0.25rem 0" }}>{evt.detail}</p>
                        {evt.source && (
                          <small className="muted">Source: {evt.source}</small>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

            {Array.isArray(enrichedPost.indigenousTerms) &&
              enrichedPost.indigenousTerms.length > 0 && (
                <section
                  className="card card-body"
                  style={{ marginTop: "1.25rem" }}
                  aria-label="Indigenous Terminology"
                >
                  <span className="eyebrow">Indigenous Lexicon</span>
                  <h3 className="heading">Key Cultural Terms</h3>
                  <dl style={{ display: "grid", gap: "0.6rem", marginTop: "0.75rem" }}>
                    {enrichedPost.indigenousTerms.map((entry) => (
                      <div key={entry.term}>
                        <dt style={{ fontWeight: 700 }}>{entry.term}</dt>
                        <dd className="muted" style={{ margin: 0 }}>
                          {entry.meaning}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

            {Array.isArray(enrichedPost.citations) &&
              enrichedPost.citations.length > 0 && (
                <section
                  className="card card-body"
                  style={{ marginTop: "1.25rem" }}
                  aria-label="Sources and Archival Citations"
                >
                  <span className="eyebrow">Sources &amp; Verification</span>
                  <h3 className="heading">Cited References</h3>
                  <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem" }}>
                    {enrichedPost.citations.map((cit, i) => (
                      <li key={i} style={{ marginBottom: "0.35rem" }}>
                        {cit}
                      </li>
                    ))}
                  </ul>
                </section>
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
                Archival Dossier
              </h3>

              <dl className="article-facts">
                <div>
                  <dt>Verification</dt>
                  <dd>
                    {enrichedPost.verificationStatus ||
                      "Curated Editorial Record"}
                  </dd>
                </div>

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
                    Culture / Community
                  </dt>
                  <dd>
                    {kgConnections.culture ? (
                      <Link to={`/cultures/${kgConnections.culture.slug}`}>
                        {enrichedPost.ethnicGroup} →
                      </Link>
                    ) : (
                      enrichedPost.ethnicGroup || "Multiple"
                    )}
                  </dd>
                </div>

                <div>
                  <dt>State &amp; Region</dt>
                  <dd>
                    {[enrichedPost.state, enrichedPost.region]
                      .filter(Boolean)
                      .join(" · ") || "Nigeria"}
                  </dd>
                </div>

                {enrichedPost.historicalPeriod && (
                  <div>
                    <dt>Historical Period</dt>
                    <dd>{enrichedPost.historicalPeriod}</dd>
                  </div>
                )}

                {enrichedPost.classification && (
                  <div>
                    <dt>Classification</dt>
                    <dd>{enrichedPost.classification}</dd>
                  </div>
                )}

                {enrichedPost.custodian && (
                  <div>
                    <dt>Custodian / Source</dt>
                    <dd>{enrichedPost.custodian}</dd>
                  </div>
                )}

                {enrichedPost.licence && (
                  <div>
                    <dt>Rights / Licence</dt>
                    <dd>{enrichedPost.licence}</dd>
                  </div>
                )}
              </dl>

              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(150,140,120,0.2)" }}>
                <Link
                  to={`/contribute?tab=correction&record=${encodeURIComponent(
                    post.id
                  )}`}
                  className="text-link"
                >
                  Report Inaccuracy / Submit Citation →
                </Link>
              </div>
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
  const initialSource =
    searchParams.get("source") || "all";

  const [search, setSearch] =
    useState(initialQuery);
  const [categoryFilter, setCategoryFilter] =
    useState("all");
  const [stateFilter, setStateFilter] =
    useState("all");
  const [communityFilter, setCommunityFilter] =
    useState("all");
  const [periodFilter, setPeriodFilter] =
    useState("all");
  const [classificationFilter, setClassificationFilter] =
    useState("all");
  const [sourceFilter, setSourceFilter] =
    useState(initialSource);
  const [sortBy, setSortBy] =
    useState("relevance");
  const [visibleCount, setVisibleCount] =
    useState(9);

  const [posts, setPosts] =
    useState([]);
  const [listings, setListings] =
    useState([]);
  const [externalItems, setExternalItems] =
    useState([]);

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch(() => setPosts([]));

    getListings()
      .then(setListings)
      .catch(() => setListings([]));

    getPublicExternalDiscoveries()
      .then(setExternalItems)
      .catch(() => setExternalItems([]));
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    if (searchParams.get("source")) {
      setSourceFilter(searchParams.get("source"));
    }
  }, [searchParams]);

  function updateSearch(value) {
    setSearch(value);
    setVisibleCount(9);

    const nextParams = {};
    if (value.trim()) nextParams.q = value;
    if (sourceFilter !== "all") nextParams.source = sourceFilter;
    setSearchParams(nextParams);
  }

  function resetAllFilters() {
    setSearch("");
    setCategoryFilter("all");
    setStateFilter("all");
    setCommunityFilter("all");
    setPeriodFilter("all");
    setClassificationFilter("all");
    setSourceFilter("all");
    setSortBy("relevance");
    setVisibleCount(9);
    setSearchParams({});
  }

  const queryValue = normalise(search);
  const hasActiveFilter =
    Boolean(queryValue) ||
    categoryFilter !== "all" ||
    stateFilter !== "all" ||
    communityFilter !== "all" ||
    periodFilter !== "all" ||
    classificationFilter !== "all" ||
    sourceFilter !== "all";

  const enrichedPosts = useMemo(
    () => posts.map(enrichRecordWithKnowledgeGraph),
    [posts]
  );

  const matchingPosts = useMemo(() => {
    const filtered = enrichedPosts.filter((post) => {
      if (
        sourceFilter !== "all" &&
        sourceFilter !== "editorial" &&
        sourceFilter !== "community"
      ) {
        return false;
      }
      if (sourceFilter === "editorial" && post.sourceType !== "editorial") {
        return false;
      }
      if (sourceFilter === "community" && post.sourceType !== "community") {
        return false;
      }
      if (categoryFilter !== "all" && post.category !== categoryFilter) {
        return false;
      }
      if (stateFilter !== "all" && post.state !== stateFilter) {
        return false;
      }
      if (
        communityFilter !== "all" &&
        normalise(post.ethnicGroup) !== normalise(communityFilter)
      ) {
        return false;
      }
      if (
        periodFilter !== "all" &&
        !normalise(
          `${post.historicalPeriod} ${post.periodFilter}`
        ).includes(normalise(periodFilter))
      ) {
        return false;
      }
      if (
        classificationFilter !== "all" &&
        post.classification !== classificationFilter
      ) {
        return false;
      }
      if (!queryValue) return true;
      return normalise(
        `${post.title} ${post.summary} ${post.body} ${post.ethnicGroup} ${post.state} ${post.region} ${post.category} ${post.classification} ${post.historicalPeriod}`
      ).includes(queryValue);
    });

    if (sortBy === "views") {
      return [...filtered].sort(
        (a, b) => Number(b.views || 0) - Number(a.views || 0)
      );
    }
    if (sortBy === "title") {
      return [...filtered].sort((a, b) =>
        String(a.title || "").localeCompare(String(b.title || ""))
      );
    }
    return filtered;
  }, [
    enrichedPosts,
    sourceFilter,
    categoryFilter,
    stateFilter,
    communityFilter,
    periodFilter,
    classificationFilter,
    queryValue,
    sortBy,
  ]);

  const matchingExternal = useMemo(() => {
    if (
      sourceFilter !== "all" &&
      sourceFilter !== "external"
    ) {
      return [];
    }
    return externalItems.filter((item) => {
      if (stateFilter !== "all" && item.state !== stateFilter) return false;
      if (
        communityFilter !== "all" &&
        normalise(item.ethnicGroup) !== normalise(communityFilter)
      ) {
        return false;
      }
      if (
        periodFilter !== "all" &&
        !normalise(item.historicalPeriod).includes(normalise(periodFilter))
      ) {
        return false;
      }
      if (
        classificationFilter !== "all" &&
        item.classification !== classificationFilter
      ) {
        return false;
      }
      if (!queryValue) return true;
      return normalise(
        `${item.title} ${item.summary} ${item.body} ${item.ethnicGroup} ${item.state} ${item.providerName} ${item.accessionNumber}`
      ).includes(queryValue);
    });
  }, [
    externalItems,
    sourceFilter,
    stateFilter,
    communityFilter,
    periodFilter,
    classificationFilter,
    queryValue,
  ]);

  const matchingListings = useMemo(() => {
    if (sourceFilter === "external" || sourceFilter === "community") {
      return [];
    }
    return listings.filter((item) => {
      if (stateFilter !== "all" && item.state !== stateFilter) return false;
      if (
        communityFilter !== "all" &&
        normalise(item.ethnicGroup) !== normalise(communityFilter)
      ) {
        return false;
      }
      if (!queryValue) return hasActiveFilter;
      return normalise(
        `${item.name} ${item.description} ${item.state} ${item.region} ${item.ethnicGroup} ${item.festivalType}`
      ).includes(queryValue);
    });
  }, [listings, sourceFilter, stateFilter, communityFilter, queryValue, hasActiveFilter]);

  const matchingCultures = useMemo(() => {
    if (sourceFilter === "external" || sourceFilter === "community") {
      return [];
    }
    return cultures.filter((culture) => {
      if (stateFilter !== "all" && !culture.states.includes(stateFilter)) {
        return false;
      }
      if (
        communityFilter !== "all" &&
        normalise(culture.name) !== normalise(communityFilter)
      ) {
        return false;
      }
      if (!queryValue) return hasActiveFilter;
      return normalise(
        `${culture.name} ${culture.region} ${culture.states.join(" ")} ${
          culture.description
        } ${(culture.kingdomsAndInstitutions || []).join(" ")}`
      ).includes(queryValue);
    });
  }, [sourceFilter, stateFilter, communityFilter, queryValue, hasActiveFilter]);

  const total =
    matchingPosts.length +
    matchingExternal.length +
    matchingListings.length +
    matchingCultures.length;

  const paginatedPosts = matchingPosts.slice(0, visibleCount);

  return (
    <>
      <section className="search-hero">
        <div className="container">
          <span className="eyebrow light">
            Multi-Facet Archival Explorer
          </span>

          <h1 className="heading">
            Search Moji&apos;s Heritage
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
              placeholder="Search Nigerian artifacts, kingdoms, states, languages, festivals, people or places..."
              aria-label="Search history, culture, language, festival, food, people or places"
              autoFocus
            />
          </div>
        </div>
      </section>

      <section className="container section">
        {/* Multi-Facet Archival Filter Bar */}
        <div
          className="card card-body"
          style={{ marginBottom: "2rem" }}
          aria-label="Archival Search Filters"
        >
          <div className="filters">
            <div className="field">
              <label htmlFor="search-category-filter">Content Type</label>
              <select
                id="search-category-filter"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setVisibleCount(9);
                }}
              >
                <option value="all">All categories</option>
                {categories.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="search-state-filter">Nigerian State</label>
              <select
                id="search-state-filter"
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setVisibleCount(9);
                }}
              >
                <option value="all">All 36 States &amp; FCT</option>
                {NIGERIAN_STATES_AND_FCT.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="search-community-filter">
                Cultural Community
              </label>
              <select
                id="search-community-filter"
                value={communityFilter}
                onChange={(e) => {
                  setCommunityFilter(e.target.value);
                  setVisibleCount(9);
                }}
              >
                <option value="all">All Nigerian Communities</option>
                {cultures.map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="search-period-filter">Historical Period</label>
              <select
                id="search-period-filter"
                value={periodFilter}
                onChange={(e) => {
                  setPeriodFilter(e.target.value);
                  setVisibleCount(9);
                }}
              >
                <option value="all">All Historical Periods</option>
                {HISTORICAL_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="search-classification-filter">
                Material / Classification
              </label>
              <select
                id="search-classification-filter"
                value={classificationFilter}
                onChange={(e) => {
                  setClassificationFilter(e.target.value);
                  setVisibleCount(9);
                }}
              >
                <option value="all">All Classifications</option>
                {ARTIFACT_CLASSIFICATIONS.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="search-source-filter">Source Collection</label>
              <select
                id="search-source-filter"
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setVisibleCount(9);
                }}
              >
                <option value="all">All Verified Collections</option>
                <option value="editorial">
                  Verified Moji&apos;s Heritage Publications
                </option>
                <option value="community">
                  Community-Contributed · Admin Approved
                </option>
                <option value="external">
                  External Open-Access Museum Collections
                </option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="search-sort-select">Sort By</label>
              <select
                id="search-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="relevance">Relevance / Featured</option>
                <option value="views">Most Viewed</option>
                <option value="title">Alphabetical (A–Z)</option>
              </select>
            </div>
          </div>

          {hasActiveFilter && (
            <div style={{ marginTop: "0.85rem" }}>
              <button
                type="button"
                className="btn outline"
                onClick={resetAllFilters}
              >
                Reset All Search Filters
              </button>
            </div>
          )}
        </div>

        <p className="result-count">
          Showing <strong>{total}</strong> verified Nigerian heritage{" "}
          {total === 1 ? "record" : "records"}
          {search.trim() ? (
            <>
              {" "}
              for <strong>“{search}”</strong>
            </>
          ) : null}
        </p>

        {matchingCultures.length > 0 && (
          <section className="search-group">
            <SectionHeading title="Nigerian Cultural Communities" />
            <div className="search-simple-grid">
              {matchingCultures.map((culture) => (
                <Link
                  className="search-result-simple"
                  key={culture.slug}
                  to={`/cultures/${culture.slug}`}
                >
                  <span className="tag">{culture.region}</span>
                  <strong>{culture.name}</strong>
                  <small>{culture.description}</small>
                </Link>
              ))}
            </div>
          </section>
        )}

        {paginatedPosts.length > 0 && (
          <section className="search-group">
            <SectionHeading title="Curated Stories & Approved Community Records" />
            <div className="grid cards">
              {paginatedPosts.map((post) => (
                <PostCard key={post.id} post={post} showCategory />
              ))}
            </div>

            {matchingPosts.length > visibleCount && (
              <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setVisibleCount((c) => c + 9)}
                >
                  Load More Records ({matchingPosts.length - visibleCount}{" "}
                  remaining)
                </button>
              </div>
            )}
          </section>
        )}

        {matchingExternal.length > 0 && (
          <section className="search-group">
            <SectionHeading
              title="External Open-Access Museum & Archival Records"
              text="Verified Nigerian artifacts and encyclopedic entries with open licences."
            />
            <div className="grid cards">
              {matchingExternal.map((item) => (
                <article className="card" key={item.id}>
                  <div className="card-body">
                    <span className="tag">
                      External Discovery · {item.providerName}
                    </span>
                    <h3 className="heading card-title">{item.title}</h3>
                    <p className="muted">{item.summary}</p>
                    <small
                      className="muted"
                      style={{ display: "block", marginBottom: "0.75rem" }}
                    >
                      {item.ethnicGroup} · {item.state} · {item.licence}
                    </small>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-link"
                    >
                      Inspect Source Record ↗
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {matchingListings.length > 0 && (
          <section className="search-group">
            <SectionHeading title="Heritage Sites, Festivals & Destinations" />
            <div className="search-simple-grid">
              {matchingListings.map((item) => (
                <Link
                  className="search-result-simple"
                  key={item.id}
                  to={`/visit/${item.id}`}
                >
                  <span className="tag">{item.festivalType}</span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.state} · {item.ethnicGroup}
                  </small>
                </Link>
              ))}
            </div>
          </section>
        )}

        {total === 0 && (
          <EmptyState
            title="Nothing matched your search or filters"
            text="Try clearing one of the filters or search for a Nigerian community, state, kingdom, festival, or historical figure."
            action="/search"
            actionLabel="Explore All Records"
          />
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

  const youtubeUrl = sanitizeHttpUrl(
    String(settings.youtubeChannelUrl || "").trim(),
    ""
  );

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
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      a: ({ node, href, ...props }) => (
        <a
          {...props}
          href={sanitizeHttpUrl(href, "#", { allowRelative: true })}
          target="_blank"
          rel="noopener noreferrer"
        />
      ),
      img: ({ node, src, alt, ...props }) => {
        const safeSrc = sanitizeHttpUrl(src, "", { allowRelative: true });
        return safeSrc ? (
          <img {...props} src={safeSrc} alt={alt || ""} loading="lazy" />
        ) : null;
      }
    }}
  >
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
            signs in to the private administrative portal or when
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
   CONTRIBUTE TO THE ARCHIVE
---------------------------------- */

export function Contribute() {
  const [searchParams] = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "correction" ? "correction" : "submit";
  const initialTargetRecord = searchParams.get("record") || "";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [form, setForm] = useState({
    title: "",
    contentType: "artifact",
    summary: "",
    body: "",
    state: "",
    locality: "",
    ethnicGroup: "",
    language: "",
    historicalPeriod:
      "Imperial Benin, Oyo, Kanem-Bornu & Hausa States (16th – 18th Century)",
    classification: "Copper-Alloy & Bronze Casting",
    custodianOrCreator: "",
    sourcesAndReferences: "",
    contributorName: "",
    attributionPreference: "Named Contributor",
    contactEmail: "",
    mediaUrl: "",
    attachmentMeta: null,
    copyrightDeclaration:
      "Public Domain / CC BY-SA 4.0 Educational Attribution Permitted",
    consentToReview: false,
    consentToPublishIfApproved: false,
    rightsConfirmation: false,
    hasIdentifiableMedia: false,
    identifiableMediaConsent: false,
    honeypot: "",
  });

  const [correctionForm, setCorrectionForm] = useState({
    referenceOrRecordId: initialTargetRecord,
    requestType: "Factual / Cultural Correction",
    requesterName: "",
    contactEmail: "",
    details: "",
    sources: "",
  });

  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [correctionConfirmation, setCorrectionConfirmation] = useState(null);

  function handleFileMetadataChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setForm((prev) => ({ ...prev, attachmentMeta: null }));
      return;
    }
    const meta = {
      name: file.name,
      type: file.type,
      size: file.size,
    };
    const check = validateAttachmentFileMeta(meta);
    if (!check.valid) {
      setErrorMessage(check.error);
      event.target.value = "";
      return;
    }
    setErrorMessage("");
    setForm((prev) => ({ ...prev, attachmentMeta: meta }));
  }

  async function handleSubmitContribution(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrorMessage("");
    setConfirmation(null);
    try {
      const record = await createPublicSubmission(form);
      setConfirmation(record);
      setForm((prev) => ({
        ...prev,
        title: "",
        summary: "",
        body: "",
        sourcesAndReferences: "",
        mediaUrl: "",
        attachmentMeta: null,
      }));
    } catch (error) {
      setErrorMessage(error.message || "Unable to submit contribution.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitCorrection(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrorMessage("");
    setCorrectionConfirmation(null);
    try {
      const result = await submitCorrectionOrWithdrawalRequest(correctionForm);
      setCorrectionConfirmation(result);
      setCorrectionForm((prev) => ({
        ...prev,
        details: "",
        sources: "",
      }));
    } catch (error) {
      setErrorMessage(error.message || "Unable to submit request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">
            Admin-Curated Archival Submissions
          </span>
          <h1 className="heading">
            Contribute to the Nigerian Cultural Archive
          </h1>
          <p>
            Share documented Nigerian artifacts, oral histories, festivals,
            indigenous terminology, heritage sites, or scholarly citations.
            Every submission enters our private curatorial review queue and is
            never displayed publicly until verified, approved, and published by
            a Moji&apos;s Heritage administrator.
          </p>
        </div>
      </section>

      <section className="container section">
        <div
          role="tablist"
          aria-label="Contribution Portal Mode"
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "submit"}
            className={activeTab === "submit" ? "btn primary" : "btn outline"}
            onClick={() => {
              setActiveTab("submit");
              setErrorMessage("");
            }}
          >
            Submit Cultural Record or Artifact
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "correction"}
            className={
              activeTab === "correction" ? "btn primary" : "btn outline"
            }
            onClick={() => {
              setActiveTab("correction");
              setErrorMessage("");
            }}
          >
            Submit Correction, Citation, or Withdrawal Request
          </button>
        </div>

        {errorMessage && (
          <div
            className="notice"
            role="alert"
            style={{ borderColor: "#a61b1b", marginBottom: "1.25rem" }}
          >
            {errorMessage}
          </div>
        )}

        {confirmation && activeTab === "submit" && (
          <div
            className="card card-body"
            role="status"
            style={{
              marginBottom: "1.5rem",
              border: "2px solid var(--gold-primary, #c89d54)",
            }}
          >
            <span className="eyebrow">Submission Received Privately</span>
            <h2 className="heading">
              Thank You — Reference Code: <code>{confirmation.referenceCode}</code>
            </h2>
            <p>
              Your contribution <strong>“{confirmation.title}”</strong> has been
              placed in the private administrator review queue with status{" "}
              <strong>{confirmation.status}</strong>. It will not appear on the
              public website unless an administrator approves and publishes it.
              Please save your reference code{" "}
              <code>{confirmation.referenceCode}</code> in case you wish to
              submit updates or request withdrawal later.
            </p>
          </div>
        )}

        {correctionConfirmation && activeTab === "correction" && (
          <div
            className="card card-body"
            role="status"
            style={{
              marginBottom: "1.5rem",
              border: "2px solid var(--gold-primary, #c89d54)",
            }}
          >
            <span className="eyebrow">Request Logged</span>
            <h2 className="heading">
              Reference: <code>{correctionConfirmation.referenceCode}</code>
            </h2>
            <p>
              Your {correctionConfirmation.requestType.toLowerCase()} for{" "}
              <strong>{correctionConfirmation.referenceOrRecordId}</strong> has
              been routed to the Moji&apos;s Heritage editorial and curatorial
              review team.
            </p>
          </div>
        )}

        {activeTab === "submit" ? (
          <form
            className="form card card-body"
            onSubmit={handleSubmitContribution}
          >
            <h2 className="heading">Archival Contribution Form</h2>
            <p className="muted">
              All submissions must relate to Nigerian cultural heritage,
              history, communities, or artifacts with Nigerian provenance.
            </p>

            {/* Honeypot anti-spam field */}
            <input
              type="text"
              name="website_url_hp"
              tabIndex={-1}
              autoComplete="off"
              style={{ display: "none" }}
              value={form.honeypot}
              onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
            />

            <div className="filters">
              <div className="field">
                <label htmlFor="contrib-title">Title of Artifact or Record *</label>
                <input
                  id="contrib-title"
                  required
                  placeholder="e.g. Igbesanmwan Ivory Saltcellar or Iseyin Loom Technique"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="contrib-type">Content Type *</label>
                <select
                  id="contrib-type"
                  value={form.contentType}
                  onChange={(e) =>
                    setForm({ ...form, contentType: e.target.value })
                  }
                >
                  {CONTRIBUTION_CONTENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filters">
              <div className="field">
                <label htmlFor="contrib-state">Nigerian State *</label>
                <select
                  id="contrib-state"
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                >
                  <option value="">Select Nigerian State</option>
                  {NIGERIAN_STATES_AND_FCT.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                  <option value="National / Multi-State">
                    National / Multi-State
                  </option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="contrib-locality">Town / LGA / Locality</label>
                <input
                  id="contrib-locality"
                  placeholder="e.g. Benin City, Oredo LGA or Igbo-Ukwu, Aguata LGA"
                  value={form.locality}
                  onChange={(e) =>
                    setForm({ ...form, locality: e.target.value })
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="contrib-community">
                  Cultural Community / Ethnic Group *
                </label>
                <input
                  id="contrib-community"
                  required
                  placeholder="e.g. Yoruba, Igbo, Hausa, Edo, Ijaw, Nupe..."
                  value={form.ethnicGroup}
                  onChange={(e) =>
                    setForm({ ...form, ethnicGroup: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="filters">
              <div className="field">
                <label htmlFor="contrib-period">
                  Historical Period or Date * (Includes Unknown / Approximate / Disputed)
                </label>
                <select
                  id="contrib-period"
                  required
                  value={form.historicalPeriod}
                  onChange={(e) =>
                    setForm({ ...form, historicalPeriod: e.target.value })
                  }
                >
                  {HISTORICAL_PERIODS.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="contrib-classification">
                  Artifact / Record Classification
                </label>
                <select
                  id="contrib-classification"
                  value={form.classification}
                  onChange={(e) =>
                    setForm({ ...form, classification: e.target.value })
                  }
                >
                  {ARTIFACT_CLASSIFICATIONS.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="contrib-language">Indigenous Language / Term</label>
                <input
                  id="contrib-language"
                  placeholder="e.g. Yorùbá, Ẹ̀dó, Àsụsụ Ìgbò, Hausa..."
                  value={form.language}
                  onChange={(e) =>
                    setForm({ ...form, language: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="contrib-custodian">
                Creator, Guild, Royal Court, Custodian, or Historical Figure
              </label>
              <input
                id="contrib-custodian"
                placeholder="e.g. Igun Eronmwon Guild, National Museum Lagos, or Oral Custodian"
                value={form.custodianOrCreator}
                onChange={(e) =>
                  setForm({ ...form, custodianOrCreator: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label htmlFor="contrib-summary">Short Summary (1–2 sentences)</label>
              <textarea
                id="contrib-summary"
                rows="2"
                placeholder="Concise overview of the cultural significance of this record..."
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </div>

            <div className="field">
              <label htmlFor="contrib-body">
                Full Cultural &amp; Historical Description *
              </label>
              <textarea
                id="contrib-body"
                required
                rows="8"
                placeholder="Provide detailed historical context, material description, ritual or social usage, and regional variations..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>

            <div className="field">
              <label htmlFor="contrib-sources">
                Sources, Archival References, Oral Custodians, or URLs *
              </label>
              <textarea
                id="contrib-sources"
                required
                rows="3"
                placeholder="Cite books, museum accession numbers, oral history elders/interviews, or institutional URLs..."
                value={form.sourcesAndReferences}
                onChange={(e) =>
                  setForm({ ...form, sourcesAndReferences: e.target.value })
                }
              />
            </div>

            <div className="filters">
              <div className="field">
                <label htmlFor="contrib-media-url">
                  Direct Media / Photograph URL (Optional)
                </label>
                <input
                  id="contrib-media-url"
                  type="url"
                  placeholder="https://..."
                  value={form.mediaUrl}
                  onChange={(e) =>
                    setForm({ ...form, mediaUrl: e.target.value })
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="contrib-file">
                  Reference Document / Image Metadata Check (JPG, PNG, WebP, PDF ≤ 8 MB)
                </label>
                <input
                  id="contrib-file"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileMetadataChange}
                />
                <small className="muted">
                  Validates and records reference file metadata (name, type, size) for curator review. Provide a Direct Media URL above to attach hosted images.
                </small>
              </div>
            </div>

            <div className="filters">
              <div className="field">
                <label htmlFor="contrib-name">Contributor Name *</label>
                <input
                  id="contrib-name"
                  placeholder="Your full name or scholarly affiliation"
                  value={form.contributorName}
                  onChange={(e) =>
                    setForm({ ...form, contributorName: e.target.value })
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="contrib-attribution">
                  Attribution Preference *
                </label>
                <select
                  id="contrib-attribution"
                  value={form.attributionPreference}
                  onChange={(e) =>
                    setForm({ ...form, attributionPreference: e.target.value })
                  }
                >
                  <option value="Named Contributor">
                    Credit my name publicly if published
                  </option>
                  <option value="Community / Institutional Credit">
                    Credit my community or institution
                  </option>
                  <option value="Anonymous">
                    Publish anonymously (Keep name private to admins)
                  </option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="contrib-email">
                  Contact Email (Optional — Private to Administrators)
                </label>
                <input
                  id="contrib-email"
                  type="email"
                  placeholder="researcher@example.com"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="contrib-rights">
                Copyright &amp; Licensing Declaration *
              </label>
              <select
                id="contrib-rights"
                value={form.copyrightDeclaration}
                onChange={(e) =>
                  setForm({ ...form, copyrightDeclaration: e.target.value })
                }
              >
                <option value="Public Domain / CC BY-SA 4.0 Educational Attribution Permitted">
                  Original work / CC BY-SA 4.0 Educational Attribution Permitted
                </option>
                <option value="CC0 1.0 Public Domain Dedication">
                  Public Domain (CC0 1.0)
                </option>
                <option value="Permission Granted by Custodian for Moji's Heritage">
                  Explicit Permission Granted by Cultural Custodian for Moji&apos;s
                  Heritage
                </option>
              </select>
            </div>

            <fieldset
              style={{
                border: "1px solid rgba(160, 145, 120, 0.35)",
                borderRadius: 12,
                padding: "1rem",
                marginTop: "0.75rem",
              }}
            >
              <legend style={{ fontWeight: 700, padding: "0 0.5rem" }}>
                Mandatory Consent &amp; Rights Declarations
              </legend>

              <label
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  alignItems: "flex-start",
                  marginBottom: "0.6rem",
                }}
              >
                <input
                  type="checkbox"
                  required
                  checked={form.consentToReview}
                  onChange={(e) =>
                    setForm({ ...form, consentToReview: e.target.checked })
                  }
                />
                <span>
                  I consent to Moji&apos;s Heritage storing and reviewing this
                  submission and its metadata in the private curatorial review
                  queue. *
                </span>
              </label>

              <label
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  alignItems: "flex-start",
                  marginBottom: "0.6rem",
                }}
              >
                <input
                  type="checkbox"
                  required
                  checked={form.consentToPublishIfApproved}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      consentToPublishIfApproved: e.target.checked,
                    })
                  }
                />
                <span>
                  I grant Moji&apos;s Heritage permission to publish this record
                  with the selected attribution if it is approved by an
                  administrator. *
                </span>
              </label>

              <label
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  alignItems: "flex-start",
                  marginBottom: "0.6rem",
                }}
              >
                <input
                  type="checkbox"
                  required
                  checked={form.rightsConfirmation}
                  onChange={(e) =>
                    setForm({ ...form, rightsConfirmation: e.target.checked })
                  }
                />
                <span>
                  I confirm that I have the right to submit this text/media and
                  that it does not violate third-party copyright or sacred
                  community restrictions. *
                </span>
              </label>

              <label
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  alignItems: "flex-start",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.hasIdentifiableMedia}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      hasIdentifiableMedia: e.target.checked,
                      identifiableMediaConsent: e.target.checked
                        ? form.identifiableMediaConsent
                        : false,
                    })
                  }
                />
                <span>
                  This submission includes identifiable photographs or voice/oral
                  recordings of living individuals.
                </span>
              </label>

              {form.hasIdentifiableMedia && (
                <label
                  style={{
                    display: "flex",
                    gap: "0.6rem",
                    alignItems: "flex-start",
                    marginTop: "0.5rem",
                    paddingLeft: "1.5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    required
                    checked={form.identifiableMediaConsent}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        identifiableMediaConsent: e.target.checked,
                      })
                    }
                  />
                  <span>
                    I confirm that informed consent has been obtained from the
                    identifiable individuals or oral history interviewees. *
                  </span>
                </label>
              )}
            </fieldset>

            <div style={{ marginTop: "1.25rem" }}>
              <button className="btn primary" type="submit" disabled={busy}>
                {busy
                  ? "Submitting to Private Review Queue..."
                  : "Submit Contribution for Admin Review"}
              </button>
            </div>
          </form>
        ) : (
          <form
            className="form card card-body"
            onSubmit={handleSubmitCorrection}
          >
            <h2 className="heading">
              Correction, Source Citation, or Takedown Request
            </h2>
            <p className="muted">
              Use this form to submit a factual correction, add a scholarly
              citation to an existing page, or request the withdrawal/update of
              a contribution using your reference code.
            </p>

            <div className="filters">
              <div className="field">
                <label htmlFor="corr-ref">
                  Submission Reference Code or Record ID / Title *
                </label>
                <input
                  id="corr-ref"
                  required
                  placeholder="e.g. MH-SUB-2026-XXXXXX or benin"
                  value={correctionForm.referenceOrRecordId}
                  onChange={(e) =>
                    setCorrectionForm({
                      ...correctionForm,
                      referenceOrRecordId: e.target.value,
                    })
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="corr-type">Request Type *</label>
                <select
                  id="corr-type"
                  value={correctionForm.requestType}
                  onChange={(e) =>
                    setCorrectionForm({
                      ...correctionForm,
                      requestType: e.target.value,
                    })
                  }
                >
                  <option value="Factual / Cultural Correction">
                    Factual or Cultural Context Correction
                  </option>
                  <option value="Additional Source Citation">
                    Additional Source / Archival Citation
                  </option>
                  <option value="Contributor Withdrawal Request">
                    Withdraw My Pending or Published Contribution
                  </option>
                  <option value="Copyright / Rights Takedown Notice">
                    Copyright or Cultural Sensitivity Review
                  </option>
                </select>
              </div>
            </div>

            <div className="filters">
              <div className="field">
                <label htmlFor="corr-name">Your Name</label>
                <input
                  id="corr-name"
                  value={correctionForm.requesterName}
                  onChange={(e) =>
                    setCorrectionForm({
                      ...correctionForm,
                      requesterName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="corr-email">Contact Email</label>
                <input
                  id="corr-email"
                  type="email"
                  value={correctionForm.contactEmail}
                  onChange={(e) =>
                    setCorrectionForm({
                      ...correctionForm,
                      contactEmail: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="corr-details">
                Details of Requested Correction or Withdrawal *
              </label>
              <textarea
                id="corr-details"
                required
                rows="5"
                placeholder="Explain the inaccuracy, missing attribution, or reason for withdrawal..."
                value={correctionForm.details}
                onChange={(e) =>
                  setCorrectionForm({
                    ...correctionForm,
                    details: e.target.value,
                  })
                }
              />
            </div>

            <div className="field">
              <label htmlFor="corr-sources">
                Supporting Sources or Evidence
              </label>
              <textarea
                id="corr-sources"
                rows="3"
                placeholder="Cite published scholarship, archival records, or community documentation..."
                value={correctionForm.sources}
                onChange={(e) =>
                  setCorrectionForm({
                    ...correctionForm,
                    sources: e.target.value,
                  })
                }
              />
            </div>

            <div style={{ marginTop: "1rem" }}>
              <button className="btn primary" type="submit" disabled={busy}>
                {busy ? "Sending Request..." : "Submit Request to Curators"}
              </button>
            </div>
          </form>
        )}
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

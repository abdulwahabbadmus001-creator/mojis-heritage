import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/Auth";
import { ADMIN_BASE_PATH, adminPath } from "../config/routes.js";
import { isSafeHttpUrl, sanitizeHttpUrl } from "../utils/urlSafety.js";
import {
  getAll,
  createItem,
  updateItem,
  removeItem,
  getSiteSettings,
  saveSiteSettings,
} from "../services/content";
import { firebaseReady } from "../firebase";
import {
  SUBMISSION_STATUSES,
  CONTRIBUTION_CONTENT_TYPES,
  getAllSubmissionsForAdmin,
  approveSubmission,
  publishSubmission,
  transitionSubmissionStatus,
  getAllCorrectionRequestsForAdmin,
  resolveCorrectionRequest,
  getAdminAuditLogs,
  recordAdminAuditEvent,
} from "../services/contributions.js";
import {
  getProviderConfigs,
  setProviderEnabled,
  getAllDiscoveryRecords,
  syncExternalHeritageSources,
  updateExternalDiscoveryDecision,
  getSyncStatusSummary,
} from "../services/externalDiscovery.js";
import {
  HISTORICAL_PERIODS,
  ARTIFACT_CLASSIFICATIONS,
  cultures,
} from "../data/cultures.js";
const CATEGORIES = [
  ["heritage", "Cultural Heritage"],
  ["festivals", "Festivals"],
  ["documentaries", "Documentaries"],
  ["histories", "Short Histories"],
  ["heroes", "Heroes & Heroines"],
  ["foods", "Traditional Foods"],
  ["languages", "Languages"],
  ["gallery", "Photo Gallery"],
];
const FESTIVAL_TYPES = [
  "Cultural Festival",
  "Religious Festival",
  "Harvest Festival",
  "Traditional Coronation",
  "Heritage Site",
  "Cultural Village",
  "Museum",
  "Natural Landmark",
];
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
  "December",
  "Year-round",
  "Varies",
];
const STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "Federal Capital Territory",
];
const REGIONS = [
  "North Central",
  "North East",
  "North West",
  "South East",
  "South South",
  "South West",
];
const blankPost = {
  title: "",
  category: "heritage",
  ethnicGroup: "",
  state: "",
  locality: "",
  region: "",
  historicalPeriod: "Post-Independence & Contemporary Heritage (1960 – Present)",
  classification: "Oral History, Festival & Living Tradition",
  custodian: "Moji's Heritage Digital Archive",
  licence: "Moji's Heritage Editorial Archive · Educational Use",
  summary: "",
  body: "",
  coverImage: "",
  youtubeUrl: "",
  isPublished: false,
  scheduledDate: "",
  views: 0,
};
const blankListing = {
  name: "",
  state: "",
  region: "",
  localGovernmentArea: "",
  ethnicGroup: "",
  festivalType: "Cultural Festival",
  startMonth: "",
  endMonth: "",
  lat: "",
  lng: "",
  photosText: "",
  description: "",
  culturalContext: "",
  visitTips: "",
  isPublished: true,
  scheduledDate: "",
};
function readableDate(value) {
  if (!value) return "—";
  try {
    if (typeof value?.toDate === "function") {
      return value.toDate().toLocaleString();
    }
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}
function categoryName(value) {
  return CATEGORIES.find(([id]) => id === value)?.[1] || value;
}
function statusFor(item) {
  if (
    item.scheduledDate &&
    !item.isPublished &&
    new Date(item.scheduledDate) > new Date()
  ) {
    return "Scheduled";
  }
  return item.isPublished ? "Published" : "Draft";
}
function StatusBadge({ item }) {
  const status = statusFor(item);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.3rem 0.65rem",
        borderRadius: "999px",
        background:
          status === "Published"
            ? "#e5f5e9"
            : status === "Scheduled"
            ? "#fff3d8"
            : "#eeeeee",
        fontSize: "0.82rem",
        fontWeight: 700,
      }}
    >
      {status}
    </span>
  );
}
function scrollAdminViewToTop(mainEl = null) {
  if (typeof window !== "undefined") {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }
  if (typeof document !== "undefined") {
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }
  if (mainEl) {
    if (typeof mainEl.scrollTo === "function") {
      try {
        mainEl.scrollTo({ top: 0, left: 0, behavior: "instant" });
      } catch {
        mainEl.scrollTop = 0;
      }
    } else {
      mainEl.scrollTop = 0;
    }
  }
}

function ImagePreview({ src, alt = "Preview" }) {
  const safeSrc = sanitizeHttpUrl(src, "", { allowRelative: true });
  if (!safeSrc) return null;
  return (
    <div style={{ marginTop: "0.75rem" }}>
      <img
        src={safeSrc}
        alt={alt}
        loading="lazy"
        style={{
          width: "100%",
          maxWidth: 420,
          height: 220,
          objectFit: "cover",
          borderRadius: 12,
        }}
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}
function AdminLoading() {
  return (
    <section className="container section">
      <h1 className="heading">Moji's Heritage Admin</h1>
      <p>Checking administrator access...</p>
    </section>
  );
}
export function AdminGate() {
  const { user, isAdmin, loading } = useAuth();
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const robotsMeta = document.querySelector('meta[name="robots"]');
    const previousContent = robotsMeta ? robotsMeta.getAttribute("content") : null;
    if (robotsMeta) {
      robotsMeta.setAttribute("content", "noindex, nofollow");
    }
    return () => {
      if (robotsMeta && previousContent) {
        robotsMeta.setAttribute("content", previousContent);
      }
    };
  }, []);
  if (loading) {
    return <AdminLoading />;
  }
  if (!firebaseReady) {
    return <AdminLogin setup />;
  }
  if (!user) {
    return <AdminLogin />;
  }
  if (!isAdmin) {
    return (
      <section className="container section">
        <h1 className="heading">Admin access denied</h1>
        <div className="notice">
          This account is authenticated, but it does not have the secure
          Firebase <code>admin: true</code> permission.
        </div>
        <p>
          Only authorised Moji's Heritage administrators can access the
          newsroom.
        </p>
      </section>
    );
  }
  return <AdminLayout />;
}
function AdminLogin({ setup = false }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (loginError) {
      console.error(loginError);
      setError(loginError.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="container section"
      style={{ maxWidth: 540, marginInline: "auto" }}
    >
      <h1 className="heading">Moji's Heritage Admin</h1>
      <p>
        Private newsroom for authorised administrators. Use the email address
        registered in Firebase Authentication and its Moji's Heritage
        password.
      </p>
      {setup && (
        <div className="notice">
          Firebase is not configured. Check the Firebase values in your
          project's <code>.env</code> file.
        </div>
      )}
      {error && (
        <div
          className="notice"
          style={{
            borderColor: "#a61b1b",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}
      <form className="form card card-body" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="admin-email">Admin email</label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="username"
            placeholder="admin@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="admin-password">Admin password</label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button
          className="btn primary"
          type="submit"
          disabled={setup || busy}
        >
          {busy ? "Checking access..." : "Sign in securely"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem" }}>
        This is a private administrator login. Public visitors do not need an
        account to use Moji's Heritage.
      </p>
    </section>
  );
}
export function AdminLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const adminMainRef = useRef(null);
  const navClass = ({ isActive }) =>
    isActive ? "admin-nav-link active" : "admin-nav-link";

  useEffect(() => {
    scrollAdminViewToTop(adminMainRef.current);
  }, [location.pathname]);

  function handleSectionNavClick() {
    scrollAdminViewToTop(adminMainRef.current);
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar" aria-label="Admin Newsroom Navigation">
        <div className="sidebar-brand">
          <div>
            <h2 className="heading">Heritage Newsroom</h2>
            <p className="sidebar-user-email">{user?.email}</p>
          </div>
          <div className="sidebar-mobile-actions">
            <Link className="sidebar-public-link" to="/">
              Public Site ↗
            </Link>
            <button
              className="btn earth sidebar-logout-btn"
              type="button"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
        <nav className="admin-sidebar-nav" aria-label="Dashboard sections">
          <NavLink
            end
            className={navClass}
            to={ADMIN_BASE_PATH}
            onClick={handleSectionNavClick}
          >
            Dashboard
          </NavLink>
          <NavLink
            className={navClass}
            to={adminPath("submissions")}
            onClick={handleSectionNavClick}
          >
            Submissions Queue
          </NavLink>
          <NavLink
            className={navClass}
            to={adminPath("discovery")}
            onClick={handleSectionNavClick}
          >
            API Discovery & Sources
          </NavLink>
          <NavLink
            className={navClass}
            to={adminPath("posts")}
            onClick={handleSectionNavClick}
          >
            Stories & Posts
          </NavLink>
          <NavLink
            className={navClass}
            to={adminPath("visit")}
            onClick={handleSectionNavClick}
          >
            Visit Planner
          </NavLink>
          <NavLink
            className={navClass}
            to={adminPath("comments")}
            onClick={handleSectionNavClick}
          >
            Comments
          </NavLink>
          <NavLink
            className={navClass}
            to={adminPath("settings")}
            onClick={handleSectionNavClick}
          >
            About & Site Settings
          </NavLink>
          <NavLink
            className={navClass}
            to={adminPath("analytics")}
            onClick={handleSectionNavClick}
          >
            Analytics
          </NavLink>
          <NavLink
            className={navClass}
            to={adminPath("audit")}
            onClick={handleSectionNavClick}
          >
            Audit Trail
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <hr />
          <Link to="/">View public website</Link>
          <button
            className="btn earth"
            type="button"
            onClick={logout}
            style={{ marginTop: "1rem", width: "100%" }}
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="admin-main" ref={adminMainRef} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
export function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [listings, setListings] = useState([]);
  const [comments, setComments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [discoveries, setDiscoveries] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [syncStatus, setSyncStatus] = useState(() => getSyncStatusSummary());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          postData,
          listingData,
          commentData,
          submissionData,
          discoveryData,
          correctionData,
        ] = await Promise.all([
          getAll("posts"),
          getAll("listings"),
          getAll("comments"),
          getAllSubmissionsForAdmin(),
          getAllDiscoveryRecords(),
          getAllCorrectionRequestsForAdmin(),
        ]);
        setPosts(postData);
        setListings(listingData);
        setComments(commentData);
        setSubmissions(submissionData);
        setDiscoveries(discoveryData);
        setCorrections(correctionData);
        setSyncStatus(getSyncStatusSummary());
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);
  const published =
    posts.filter((post) => post.isPublished).length +
    submissions.filter((sub) => sub.status === "Published").length;
  const drafts = posts.filter((post) => !post.isPublished).length;
  const pendingSubmissionsCount = submissions.filter((sub) =>
    ["Submitted", "Pending Review", "Needs Correction"].includes(sub.status)
  ).length;
  const approvedUnpublishedCount = submissions.filter(
    (sub) => sub.status === "Approved" && !sub.isPublished
  ).length;
  const rejectedSubmissionsCount = submissions.filter(
    (sub) => sub.status === "Rejected"
  ).length;
  const apiAwaitingReviewCount = discoveries.filter(
    (item) => item.status === "Pending Review" || item.trustLevel === "needs_review"
  ).length;
  const failedApiJobsCount = Number(syncStatus?.failedJobsCount || 0);
  const recentlyUpdatedCount =
    posts.filter((post) => Boolean(post.updatedAt || post.publishedAt)).length +
    submissions.filter((sub) => Boolean(sub.updatedAt)).length;
  const verificationNeededCount =
    submissions.filter(
      (sub) =>
        sub.status !== "Rejected" &&
        (!sub.citationVerified || !sub.permissionVerified)
    ).length +
    discoveries.filter(
      (item) =>
        item.trustLevel === "needs_review" ||
        item.trustLevel === "rights_restricted" ||
        !item.licenceVerified
    ).length +
    corrections.filter((c) => c.status === "Pending Review").length;
  const pendingComments = comments.filter(
    (comment) => !comment.isApproved && !comment.isFlagged
  ).length;
  const recentComments = [...comments]
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    })
    .slice(0, 5);
  if (loading) {
    return <p>Loading newsroom...</p>;
  }
  return (
    <>
      <h1 className="heading">Dashboard</h1>
      <p>
        Manage Moji's Heritage stories, contributor submissions, external API
        discoveries, destinations, community discussions, and public archive
        settings from one unified newsroom.
      </p>
      <div className="grid cards">
        <div className="card card-body">
          <b>Total published records</b>
          <h2>{published}</h2>
          <small className="muted">Stories & approved publications</small>
        </div>
        <div className="card card-body">
          <b>Pending submissions</b>
          <h2>{pendingSubmissionsCount}</h2>
          <small className="muted">Private queue awaiting review</small>
        </div>
        <div className="card card-body">
          <b>Approved (unpublished)</b>
          <h2>{approvedUnpublishedCount}</h2>
          <small className="muted">Ready for admin publication</small>
        </div>
        <div className="card card-body">
          <b>Rejected submissions</b>
          <h2>{rejectedSubmissionsCount}</h2>
          <small className="muted">Excluded from public archive</small>
        </div>
        <div className="card card-body">
          <b>API content awaiting review</b>
          <h2>{apiAwaitingReviewCount}</h2>
          <small className="muted">External Nigerian heritage queue</small>
        </div>
        <div className="card card-body">
          <b>Failed API jobs / errors</b>
          <h2>{failedApiJobsCount}</h2>
          <small className="muted">
            Last sync: {readableDate(syncStatus?.lastSyncAt)}
          </small>
        </div>
        <div className="card card-body">
          <b>Recently updated records</b>
          <h2>{recentlyUpdatedCount}</h2>
          <small className="muted">{drafts} editorial drafts</small>
        </div>
        <div className="card card-body">
          <b>Citation / rights verification</b>
          <h2>{verificationNeededCount}</h2>
          <small className="muted">
            {pendingComments} pending comments · {listings.length} destinations
          </small>
        </div>
      </div>
      <section className="section">
        <h2 className="heading">Quick actions</h2>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <Link className="btn primary" to={adminPath("submissions")}>
            Review submissions ({pendingSubmissionsCount})
          </Link>
          <Link className="btn earth" to={adminPath("discovery")}>
            Manage API discovery ({apiAwaitingReviewCount})
          </Link>
          <Link className="btn" to={adminPath("posts")}>
            Create or edit story
          </Link>
          <Link className="btn" to={adminPath("visit")}>
            Add destination
          </Link>
          <Link className="btn" to={adminPath("comments")}>
            Moderate comments
          </Link>
          <Link className="btn" to={adminPath("audit")}>
            View audit log
          </Link>
        </div>
      </section>
      <section className="section">
        <h2 className="heading">Recent comments</h2>
        {recentComments.length === 0 ? (
          <div className="card card-body">
            <p className="muted">No comments have been submitted yet.</p>
          </div>
        ) : (
          <div className="grid">
            {recentComments.map((comment) => (
              <div className="card card-body" key={comment.id}>
                <strong>{comment.displayName || "Visitor"}</strong>
                <p>{comment.text}</p>
                <small className="muted">
                  {comment.isFlagged
                    ? "Flagged"
                    : comment.isApproved
                    ? "Approved"
                    : "Pending"}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="notice">
        Phase 2 monetisation: promoted cultural destinations and sponsored
        heritage features can be managed here in a future release.
      </div>
    </>
  );
}
export function PostsAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankPost);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  async function load() {
    setLoading(true);
    try {
      const data = await getAll("posts");
      setItems(data);
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  function resetForm() {
    setForm(blankPost);
    scrollAdminViewToTop();
  }
  function editPost(post) {
    setForm({
      ...blankPost,
      ...post,
      scheduledDate: post.scheduledDate || "",
    });
    scrollAdminViewToTop();
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    const publishing = Boolean(form.isPublished);
    const data = {
      title: String(form.title || "").trim(),
      category: form.category,
      ethnicGroup: String(form.ethnicGroup || "").trim(),
      state: String(form.state || "").trim(),
      locality: String(form.locality || "").trim(),
      region: form.region,
      historicalPeriod: String(form.historicalPeriod || "").trim(),
      classification: String(form.classification || "").trim(),
      custodian: String(form.custodian || "").trim(),
      licence: String(form.licence || "").trim(),
      summary: String(form.summary || "").trim(),
      body: String(form.body || "").trim(),
      coverImage: String(form.coverImage || "").trim(),
      youtubeUrl: String(form.youtubeUrl || "").trim(),
      isPublished: publishing,
      scheduledDate: form.scheduledDate || null,
      views: Number(form.views || 0),
    };
    if (
      data.coverImage &&
      !isSafeHttpUrl(data.coverImage, { allowRelative: true })
    ) {
      alert("Cover image URL must be a valid http:// or https:// web address.");
      return;
    }
    if (data.youtubeUrl && !isSafeHttpUrl(data.youtubeUrl)) {
      alert("YouTube video URL must be a valid http:// or https:// web address.");
      return;
    }
    if (!data.title && !data.body) {
      alert("Add a title or some article content before saving a draft.");
      return;
    }
    if (publishing && (!data.title || !data.summary || !data.body)) {
      alert("A published story requires a title, summary and full article.");
      return;
    }
    if (publishing && !window.confirm("Publish this story to the public website now?")) {
      return;
    }
    setBusy(true);
    try {
      const editing = Boolean(form.id);
      if (editing) {
        await updateItem("posts", form.id, data);
      } else {
        await createItem("posts", data);
      }
      resetForm();
      await load();
      alert(publishing ? "Story published." : editing ? "Draft updated." : "Draft saved privately.");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function togglePublish(post) {
    const publishing = !post.isPublished;
    if (publishing && (!post.title?.trim() || !post.summary?.trim() || !post.body?.trim())) {
      alert("Complete the title, summary and article before publishing.");
      editPost(post);
      return;
    }
    if (!window.confirm(publishing
      ? `Publish "${post.title}" publicly?`
      : `Unpublish "${post.title}" and return it to drafts?`)) return;
    try {
      await updateItem("posts", post.id, { isPublished: publishing });
      await load();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }
  async function deletePost(post) {
    if (!window.confirm(`Delete "${post.title}" permanently?`)) {
      return;
    }
    try {
      await removeItem("posts", post.id);
      if (form.id === post.id) {
        resetForm();
      }
      await load();
    } catch (error) {
      alert(error.message);
    }
  }
  const filteredItems = useMemo(() => items.filter((item) => {
    const categoryMatches = filter === "all" || item.category === filter;
    const statusMatches = statusFilter === "all" ||
      (statusFilter === "published" ? Boolean(item.isPublished) : !item.isPublished);
    return categoryMatches && statusMatches;
  }), [items, filter, statusFilter]);
  const draftCount = items.filter((item) => !item.isPublished).length;
  const publishedCount = items.filter((item) => item.isPublished).length;
  return (
    <>
      <h1 className="heading">Stories & Posts</h1>
      <p>
        Publish history, cultural discoveries, festivals, languages,
        traditional foods, heroes, documentaries and gallery stories without
        editing the website source code.
      </p>
      <div className="notice">
        Image uploads currently use externally hosted image URLs because
        Firebase Storage requires the Blaze billing plan. Paste a direct image
        URL below.
      </div>
      <form className="form card card-body" onSubmit={save}>
        <h2>{form.id ? "Edit story" : "Create new story"}</h2>
        <div className="field">
          <label>Title</label>
          <input
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title: event.target.value,
              })
            }
          />
        </div>
        <div className="filters">
          <div className="field">
            <label>Category</label>
            <select
              value={form.category}
              onChange={(event) =>
                setForm({
                  ...form,
                  category: event.target.value,
                })
              }
            >
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Ethnic group</label>
            <input
              value={form.ethnicGroup}
              placeholder="e.g. Yoruba"
              onChange={(event) =>
                setForm({
                  ...form,
                  ethnicGroup: event.target.value,
                })
              }
            />
          </div>
          <div className="field">
            <label>Region</label>
            <select
              value={form.region}
              onChange={(event) =>
                setForm({
                  ...form,
                  region: event.target.value,
                })
              }
            >
              <option value="">Select region</option>
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
              <option value="Nigeria">National / Nigeria</option>
            </select>
          </div>
          <div className="field">
            <label>Nigerian State</label>
            <select
              value={form.state || ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  state: event.target.value,
                })
              }
            >
              <option value="">Select state / national</option>
              {STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
              <option value="National / Multi-State">National / Multi-State</option>
            </select>
          </div>
          <div className="field">
            <label>Historical Period</label>
            <select
              value={form.historicalPeriod || ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  historicalPeriod: event.target.value,
                })
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
            <label>Classification / Medium</label>
            <select
              value={form.classification || ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  classification: event.target.value,
                })
              }
            >
              {ARTIFACT_CLASSIFICATIONS.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Summary</label>
          <textarea
            rows="3"
            placeholder="A short introduction shown on story cards."
            value={form.summary}
            onChange={(event) =>
              setForm({
                ...form,
                summary: event.target.value,
              })
            }
          />
        </div>
        <div className="field">
          <label>Full story</label>
          <textarea
            rows="14"
            placeholder="Write the complete article here..."
            value={form.body}
            onChange={(event) =>
              setForm({
                ...form,
                body: event.target.value,
              })
            }
          />
        </div>
        <div className="field">
          <label>Cover image URL</label>
          <input
            type="url"
            placeholder="https://..."
            value={form.coverImage}
            onChange={(event) =>
              setForm({
                ...form,
                coverImage: event.target.value,
              })
            }
          />
          <ImagePreview src={form.coverImage} alt={form.title} />
        </div>
        {form.category === "documentaries" && (
          <div className="field">
            <label>YouTube video URL</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={form.youtubeUrl}
              onChange={(event) =>
                setForm({
                  ...form,
                  youtubeUrl: event.target.value,
                })
              }
            />
          </div>
        )}
        <div className="field">
          <label>Schedule publication date and time (optional)</label>
          <input
            type="datetime-local"
            value={form.scheduledDate || ""}
            onChange={(event) =>
              setForm({
                ...form,
                scheduledDate: event.target.value,
              })
            }
          />
          <small className="muted">
            Scheduling information is stored now. Automatic publication can be
            activated later with a scheduled backend function.
          </small>
        </div>
        <label
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <input
            type="checkbox"
            checked={Boolean(form.isPublished)}
            onChange={(event) =>
              setForm({
                ...form,
                isPublished: event.target.checked,
              })
            }
          />
          Publish this story now
        </label>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginTop: "1rem",
          }}
        >
          <button className="btn primary" disabled={busy}>
            {busy
              ? "Saving..."
              : form.isPublished
              ? "Publish story"
              : "Save draft"}
          </button>
          {form.id && (
            <button
              className="btn"
              type="button"
              onClick={resetForm}
            >
              Cancel editing
            </button>
          )}
        </div>
      </form>
      <section className="section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <h2 className="heading">Existing content</h2>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select aria-label="Filter by publication status" value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All stories ({items.length})</option>
            <option value="draft">Drafts ({draftCount})</option>
            <option value="published">Published ({publishedCount})</option>
          </select>
        </div>
        {loading ? (
          <p>Loading stories...</p>
        ) : filteredItems.length === 0 ? (
          <div className="card card-body">
            <p className="muted">No stories found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Story</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <strong>{post.title}</strong>
                      <br />
                      <small>{post.ethnicGroup}</small>
                    </td>
                    <td>{categoryName(post.category)}</td>
                    <td>
                      <StatusBadge item={post} />
                    </td>
                    <td>{post.views || 0}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => editPost(post)}
                      >
                        Edit
                      </button>{" "}
                      <button
                        type="button"
                        onClick={() => togglePublish(post)}
                      >
                        {post.isPublished ? "Unpublish" : "Publish"}
                      </button>{" "}
                      <button
                        type="button"
                        onClick={() => deletePost(post)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
export function ListingsAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankListing);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try {
      setItems(await getAll("listings"));
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  function resetForm() {
    setForm(blankListing);
    scrollAdminViewToTop();
  }
  function editListing(item) {
    setForm({
      ...blankListing,
      ...item,
      lat: item.coordinates?.lat ?? "",
      lng: item.coordinates?.lng ?? "",
      photosText: Array.isArray(item.photos)
        ? item.photos.join("\n")
        : "",
      scheduledDate: item.scheduledDate || "",
    });
    scrollAdminViewToTop();
  }
  async function save(event) {
    event.preventDefault();
    if (
      form.youtubeChannelUrl &&
      !isSafeHttpUrl(String(form.youtubeChannelUrl).trim())
    ) {
      alert("YouTube channel URL must be a valid http:// or https:// web address.");
      return;
    }
    setBusy(true);
    try {
      const lat = Number(form.lat);
      const lng = Number(form.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error(
          "Please enter valid latitude and longitude values."
        );
      }
      const photos = form.photosText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 8);
      if (photos.some((url) => !isSafeHttpUrl(url, { allowRelative: true }))) {
        throw new Error(
          "All destination photo URLs must be valid http:// or https:// web addresses."
        );
      }
      const data = {
        name: form.name.trim(),
        state: form.state,
        region: form.region,
        localGovernmentArea: form.localGovernmentArea.trim(),
        ethnicGroup: form.ethnicGroup.trim(),
        festivalType: form.festivalType,
        startMonth: form.startMonth,
        endMonth: form.endMonth,
        coordinates: {
          lat,
          lng,
        },
        photos,
        description: form.description.trim(),
        culturalContext: form.culturalContext.trim(),
        visitTips: form.visitTips.trim(),
        isPublished: Boolean(form.isPublished),
        scheduledDate: form.scheduledDate || null,
      };
      if (form.id) {
        await updateItem("listings", form.id, data);
      } else {
        await createItem("listings", data);
      }
      resetForm();
      await load();
      alert(form.id ? "Listing updated." : "Listing created.");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function togglePublish(item) {
    try {
      await updateItem("listings", item.id, {
        isPublished: !item.isPublished,
      });
      await load();
    } catch (error) {
      alert(error.message);
    }
  }
  async function deleteListing(item) {
    if (!window.confirm(`Delete "${item.name}" permanently?`)) {
      return;
    }
    try {
      await removeItem("listings", item.id);
      if (form.id === item.id) {
        resetForm();
      }
      await load();
    } catch (error) {
      alert(error.message);
    }
  }
  const firstPreviewImage = form.photosText
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean)[0];
  return (
    <>
      <h1 className="heading">Visit Planner Management</h1>
      <p>
        Manage festivals, heritage sites, museums, cultural villages and other
        destinations displayed in the public Visit & Festival Planner.
      </p>
      <form className="form card card-body" onSubmit={save}>
        <h2>
          {form.id ? "Edit destination" : "Add destination or festival"}
        </h2>
        <div className="field">
          <label>Name</label>
          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name: event.target.value,
              })
            }
          />
        </div>
        <div className="filters">
          <div className="field">
            <label>State</label>
            <select
              required
              value={form.state}
              onChange={(event) =>
                setForm({
                  ...form,
                  state: event.target.value,
                })
              }
            >
              <option value="">Select state</option>
              {STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Region</label>
            <select
              required
              value={form.region}
              onChange={(event) =>
                setForm({
                  ...form,
                  region: event.target.value,
                })
              }
            >
              <option value="">Select region</option>
              {REGIONS.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Local Government Area</label>
            <input
              required
              value={form.localGovernmentArea}
              onChange={(event) =>
                setForm({
                  ...form,
                  localGovernmentArea: event.target.value,
                })
              }
            />
          </div>
        </div>
        <div className="filters">
          <div className="field">
            <label>Ethnic group</label>
            <input
              required
              placeholder="e.g. Yoruba"
              value={form.ethnicGroup}
              onChange={(event) =>
                setForm({
                  ...form,
                  ethnicGroup: event.target.value,
                })
              }
            />
          </div>
          <div className="field">
            <label>Festival / destination type</label>
            <select
              value={form.festivalType}
              onChange={(event) =>
                setForm({
                  ...form,
                  festivalType: event.target.value,
                })
              }
            >
              {FESTIVAL_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filters">
          <div className="field">
            <label>Start month</label>
            <select
              required
              value={form.startMonth}
              onChange={(event) =>
                setForm({
                  ...form,
                  startMonth: event.target.value,
                })
              }
            >
              <option value="">Select</option>
              {MONTHS.map((month) => (
                <option key={month}>{month}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>End month</label>
            <select
              required
              value={form.endMonth}
              onChange={(event) =>
                setForm({
                  ...form,
                  endMonth: event.target.value,
                })
              }
            >
              <option value="">Select</option>
              {MONTHS.map((month) => (
                <option key={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="filters">
          <div className="field">
            <label>GPS latitude</label>
            <input
              required
              type="number"
              step="any"
              placeholder="7.7667"
              value={form.lat}
              onChange={(event) =>
                setForm({
                  ...form,
                  lat: event.target.value,
                })
              }
            />
          </div>
          <div className="field">
            <label>GPS longitude</label>
            <input
              required
              type="number"
              step="any"
              placeholder="4.5667"
              value={form.lng}
              onChange={(event) =>
                setForm({
                  ...form,
                  lng: event.target.value,
                })
              }
            />
          </div>
        </div>
        <div className="field">
          <label>Photo URLs — maximum 8</label>
          <textarea
            rows="5"
            placeholder={
              "Paste one direct image URL per line.\nhttps://...\nhttps://..."
            }
            value={form.photosText}
            onChange={(event) =>
              setForm({
                ...form,
                photosText: event.target.value,
              })
            }
          />
          <ImagePreview
            src={firstPreviewImage}
            alt={form.name || "Destination preview"}
          />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            required
            rows="9"
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description: event.target.value,
              })
            }
          />
        </div>
        <div className="field">
          <label>Cultural context</label>
          <textarea
            rows="6"
            placeholder="Explain the cultural significance of this festival or place."
            value={form.culturalContext}
            onChange={(event) =>
              setForm({
                ...form,
                culturalContext: event.target.value,
              })
            }
          />
        </div>
        <div className="field">
          <label>Practical visit tips</label>
          <textarea
            rows="7"
            placeholder="Transport, best time to visit, dress code, what visitors should expect..."
            value={form.visitTips}
            onChange={(event) =>
              setForm({
                ...form,
                visitTips: event.target.value,
              })
            }
          />
        </div>
        <div className="field">
          <label>Schedule publication (optional)</label>
          <input
            type="datetime-local"
            value={form.scheduledDate || ""}
            onChange={(event) =>
              setForm({
                ...form,
                scheduledDate: event.target.value,
              })
            }
          />
        </div>
        <label
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <input
            type="checkbox"
            checked={Boolean(form.isPublished)}
            onChange={(event) =>
              setForm({
                ...form,
                isPublished: event.target.checked,
              })
            }
          />
          Published
        </label>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginTop: "1rem",
          }}
        >
          <button className="btn primary" disabled={busy}>
            {busy
              ? "Saving..."
              : form.id
              ? "Save changes"
              : "Create listing"}
          </button>
          {form.id && (
            <button
              className="btn"
              type="button"
              onClick={resetForm}
            >
              Cancel editing
            </button>
          )}
        </div>
      </form>
      <section className="section">
        <h2 className="heading">Existing Visit Planner listings</h2>
        {loading ? (
          <p>Loading listings...</p>
        ) : items.length === 0 ? (
          <div className="card card-body">
            <p className="muted">No Visit Planner listings found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>State</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <br />
                      <small>{item.ethnicGroup}</small>
                    </td>
                    <td>{item.state}</td>
                    <td>{item.festivalType}</td>
                    <td>
                      <StatusBadge item={item} />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => editListing(item)}
                      >
                        Edit
                      </button>{" "}
                      <button
                        type="button"
                        onClick={() => togglePublish(item)}
                      >
                        {item.isPublished ? "Unpublish" : "Publish"}
                      </button>{" "}
                      <button
                        type="button"
                        onClick={() => deleteListing(item)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
export function CommentsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try {
      setItems(await getAll("comments"));
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function approve(comment) {
    try {
      await updateItem("comments", comment.id, {
        isApproved: true,
        isFlagged: false,
      });
      await load();
    } catch (error) {
      alert(error.message);
    }
  }
  async function flag(comment) {
    try {
      await updateItem("comments", comment.id, {
        isApproved: false,
        isFlagged: true,
      });
      await load();
    } catch (error) {
      alert(error.message);
    }
  }
  async function remove(comment) {
    if (!window.confirm("Delete this comment permanently?")) {
      return;
    }
    try {
      await removeItem("comments", comment.id);
      await load();
    } catch (error) {
      alert(error.message);
    }
  }
  return (
    <>
      <h1 className="heading">Comment Moderation</h1>
      <p>
        Review visitor opinions before they appear publicly on Moji's
        Heritage.
      </p>
      {loading ? (
        <p>Loading comments...</p>
      ) : items.length === 0 ? (
        <div className="card card-body">
          <p className="muted">No comments have been submitted yet.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Comment</th>
                <th>Post</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((comment) => (
                <tr key={comment.id}>
                  <td>{comment.displayName || "Visitor"}</td>
                  <td style={{ maxWidth: 420 }}>
                    {comment.text}
                  </td>
                  <td>{comment.postTitle || comment.postId || "—"}</td>
                  <td>{readableDate(comment.createdAt)}</td>
                  <td>
                    {comment.isFlagged
                      ? "Flagged"
                      : comment.isApproved
                      ? "Approved"
                      : "Pending"}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => approve(comment)}
                    >
                      Approve
                    </button>{" "}
                    <button
                      type="button"
                      onClick={() => flag(comment)}
                    >
                      Flag
                    </button>{" "}
                    <button
                      type="button"
                      onClick={() => remove(comment)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
export function SiteSettings() {
  const [form, setForm] = useState({
    aboutTitle: "About Moji's Heritage",
    aboutBody: "",
    vision: "",
    mission: "",
    youtubeChannelUrl: "",
    contactEmail: "",
  });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      try {
        const settings = await getSiteSettings();
        setForm((current) => ({
          ...current,
          ...settings,
        }));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);
  async function save(event) {
    event.preventDefault();
    if (
      form.youtubeChannelUrl &&
      !isSafeHttpUrl(String(form.youtubeChannelUrl).trim())
    ) {
      alert("YouTube channel URL must be a valid http:// or https:// web address.");
      return;
    }
    setBusy(true);
    try {
      await saveSiteSettings(form);
      alert(
        "About Us, Vision, Mission and website settings have been updated."
      );
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) {
    return <p>Loading website settings...</p>;
  }
  return (
    <>
      <h1 className="heading">About & Site Settings</h1>
      <p>
        Edit important public information without changing the React source
        code.
      </p>
      <form className="form card card-body" onSubmit={save}>
        <div className="field">
          <label>About page title</label>
          <input
            required
            value={form.aboutTitle}
            onChange={(event) =>
              setForm({
                ...form,
                aboutTitle: event.target.value,
              })
            }
          />
        </div>
        <div className="field">
          <label>About Us</label><p className="field-hint">
  Markdown supported: use ## for headings, **text** for bold,
  *text* for italics, and - for bullet points. Separate paragraphs
  with a blank line.
</p>
          <textarea
            required
            rows="10"
            value={form.aboutBody}
            onChange={(event) =>
              setForm({
                ...form,
                aboutBody: event.target.value,
              })
            }
          />
        </div>
        <div className="field">
          <label>Our Vision</label>
          <textarea
            rows="5"
            value={form.vision}
            onChange={(event) =>
              setForm({
                ...form,
                vision: event.target.value,
              })
            }
          />
        </div>
        <div className="field">
          <label>Our Mission</label>
          <textarea
            required
            rows="5"
            value={form.mission}
            onChange={(event) =>
              setForm({
                ...form,
                mission: event.target.value,
              })
            }
          />
        </div>
        <div className="field">
          <label>YouTube channel URL</label>
          <input
            type="url"
            placeholder="https://www.youtube.com/@..."
            value={form.youtubeChannelUrl}
            onChange={(event) =>
              setForm({
                ...form,
                youtubeChannelUrl: event.target.value,
              })
            }
          />
        </div>
        <div className="field">
          <label>Public contact email</label>
          <input
            type="email"
            placeholder="hello@example.com"
            value={form.contactEmail}
            onChange={(event) =>
              setForm({
                ...form,
                contactEmail: event.target.value,
              })
            }
          />
        </div>
        <button
          className="btn primary"
          disabled={busy}
        >
          {busy ? "Saving..." : "Save public information"}
        </button>
      </form>
    </>
  );
}
export function Analytics() {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [listings, setListings] = useState([]);
  useEffect(() => {
    Promise.all([
      getAll("posts"),
      getAll("comments"),
      getAll("listings"),
    ])
      .then(([postData, commentData, listingData]) => {
        setPosts(postData);
        setComments(commentData);
        setListings(listingData);
      })
      .catch(console.error);
  }, []);
  const topPosts = [...posts]
    .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
    .slice(0, 5);
  const categoryCounts = CATEGORIES.map(([value, label]) => ({
    value,
    label,
    count: posts.filter((post) => post.category === value).length,
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return (
    <>
      <h1 className="heading">Analytics</h1>
      <div className="grid cards">
        <div className="card card-body">
          <b>Total stories</b>
          <h2>{posts.length}</h2>
        </div>
        <div className="card card-body">
          <b>Total story views</b>
          <h2>
            {posts.reduce(
              (total, post) => total + Number(post.views || 0),
              0
            )}
          </h2>
        </div>
        <div className="card card-body">
          <b>Comments</b>
          <h2>{comments.length}</h2>
        </div>
        <div className="card card-body">
          <b>Visit destinations</b>
          <h2>{listings.length}</h2>
        </div>
      </div>
      <div
        className="grid cards"
        style={{ marginTop: "1.5rem" }}
      >
        <div className="card card-body">
          <h2>Top 5 stories</h2>
          {topPosts.length === 0 ? (
            <p className="muted">No view data yet.</p>
          ) : (
            <ol>
              {topPosts.map((post) => (
                <li key={post.id} style={{ marginBottom: "0.75rem" }}>
                  <strong>{post.title}</strong>
                  <br />
                  <small>{post.views || 0} views</small>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="card card-body">
          <h2>Content distribution</h2>
          <ol>
            {categoryCounts.map((category) => (
              <li
                key={category.value}
                style={{ marginBottom: "0.75rem" }}
              >
                <strong>{category.label}</strong>
                <br />
                <small>{category.count} stories</small>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="notice" style={{ marginTop: "1.5rem" }}>
        Visit Planner search-filter analytics and registered-user statistics
        will become available when those events are recorded in Firestore.
      </div>
    </>
  );
}

export function SubmissionsAdmin() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [communityFilter, setCommunityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [editDraft, setEditDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [subs, corrs] = await Promise.all([
        getAllSubmissionsForAdmin(),
        getAllCorrectionRequestsForAdmin(),
      ]);
      setSubmissions(subs);
      setCorrections(corrs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const selectedSubmission = useMemo(
    () => submissions.find((item) => item.id === selectedId) || null,
    [submissions, selectedId]
  );

  function openSubmission(sub) {
    setSelectedId(sub.id);
    setReviewerNotes(sub.reviewerNotes || "");
    setEditDraft({
      title: sub.title || "",
      summary: sub.summary || "",
      body: sub.body || "",
      ethnicGroup: sub.ethnicGroup || "",
      state: sub.state || "",
      historicalPeriod: sub.historicalPeriod || "",
      sourcesAndReferences: sub.sourcesAndReferences || "",
    });
    scrollAdminViewToTop();
  }

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (statusFilter !== "all" && sub.status !== statusFilter) return false;
      if (typeFilter !== "all" && sub.contentType !== typeFilter) return false;
      if (stateFilter !== "all" && sub.state !== stateFilter) return false;
      if (
        communityFilter !== "all" &&
        String(sub.ethnicGroup || "").toLowerCase() !==
          communityFilter.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = [
          sub.title,
          sub.referenceCode,
          sub.contributorName,
          sub.ethnicGroup,
          sub.state,
          sub.summary,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    submissions,
    statusFilter,
    typeFilter,
    stateFilter,
    communityFilter,
    searchQuery,
  ]);

  async function handleApproveOnly(sub) {
    if (busy) return;
    setBusy(true);
    try {
      await approveSubmission(sub.id, {
        adminEmail: user?.email || "admin",
        reviewerNotes,
        editedFields: editDraft || {},
      });
      await loadAll();
      alert(
        `Submission "${sub.title}" has been marked Approved (not yet published to the public archive).`
      );
    } catch (error) {
      alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePublishApproved(sub) {
    if (busy) return;
    if (sub.status !== "Approved" && sub.status !== "Published") {
      alert(
        "Approval and publication are distinct steps. Please click '1. Approve Submission' first, verify the preview, and then click '2. Publish to Public Archive'."
      );
      return;
    }
    if (
      !window.confirm(
        `Publish "${sub.title}" (${sub.referenceCode}) to the public Moji's Heritage archive now?`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await publishSubmission(sub.id, {
        adminEmail: user?.email || "admin",
        reviewerNotes,
      });
      await loadAll();
      alert(
        `Submission "${sub.title}" is now Published to the public archive.`
      );
    } catch (error) {
      alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusTransition(sub, nextStatus) {
    if (busy) return;
    setBusy(true);
    try {
      await transitionSubmissionStatus(sub.id, nextStatus, {
        adminEmail: user?.email || "admin",
        reviewerNotes,
      });
      await loadAll();
    } catch (error) {
      alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResolveCorrection(req, status) {
    try {
      await resolveCorrectionRequest(req.id, {
        status,
        adminEmail: user?.email || "admin",
        resolutionNotes: `Reviewed by ${user?.email || "admin"}`,
      });
      await loadAll();
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <>
      <h1 className="heading">Submissions & Curatorial Review Queue</h1>
      <p>
        Review public contributions privately. Submissions never appear on the
        public website until an administrator first <strong>Approves</strong>{" "}
        and then explicitly <strong>Publishes</strong> them.
      </p>

      <div className="card card-body" style={{ marginBottom: "1.25rem" }}>
        <div className="filters">
          <div className="field">
            <label htmlFor="sub-search">Search title, reference, contributor</label>
            <input
              id="sub-search"
              placeholder="e.g. MH-SUB-2026 or Benin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="sub-status-filter">Workflow Status</label>
            <select
              id="sub-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses ({submissions.length})</option>
              {SUBMISSION_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sub-type-filter">Content Type</label>
            <select
              id="sub-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All content types</option>
              {CONTRIBUTION_CONTENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sub-state-filter">Nigerian State</label>
            <select
              id="sub-state-filter"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="all">All states</option>
              {STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sub-community-filter">Cultural Community</label>
            <select
              id="sub-community-filter"
              value={communityFilter}
              onChange={(e) => setCommunityFilter(e.target.value)}
            >
              <option value="all">All communities</option>
              {cultures.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedSubmission && editDraft && (
        <section
          className="card card-body"
          style={{
            marginBottom: "1.5rem",
            border: "2px solid var(--gold-primary, #c89d54)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <span className="pill">{selectedSubmission.referenceCode}</span>{" "}
              <span className="pill">{selectedSubmission.status}</span>
              <h2 className="heading" style={{ marginTop: "0.5rem" }}>
                Curatorial Inspection: {selectedSubmission.title}
              </h2>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => setSelectedId(null)}
            >
              Close inspector
            </button>
          </div>

          <div className="grid cards" style={{ marginTop: "1rem" }}>
            <div className="card card-body">
              <b>Contributor & Attribution</b>
              <p>
                {selectedSubmission.contributorName} (
                {selectedSubmission.attributionPreference})
              </p>
              <small className="muted">
                Contact: {selectedSubmission.contactEmail || "Not provided"}
              </small>
            </div>
            <div className="card card-body">
              <b>Rights & Consent Verification</b>
              <p>
                Review consent:{" "}
                {selectedSubmission.consentToReview ? "Yes" : "No"} · Publish
                consent:{" "}
                {selectedSubmission.consentToPublishIfApproved ? "Yes" : "No"} ·
                Rights confirmed:{" "}
                {selectedSubmission.rightsConfirmation ? "Yes" : "No"}
              </p>
              <small className="muted">
                Licence: {selectedSubmission.copyrightDeclaration}
              </small>
            </div>
          </div>

          <div className="filters" style={{ marginTop: "1rem" }}>
            <div className="field">
              <label>Title (Editable before approval)</label>
              <input
                value={editDraft.title}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, title: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>Cultural Community</label>
              <input
                value={editDraft.ethnicGroup}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, ethnicGroup: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>State</label>
              <input
                value={editDraft.state}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, state: e.target.value })
                }
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: "0.75rem" }}>
            <label>Summary</label>
            <textarea
              rows="2"
              value={editDraft.summary}
              onChange={(e) =>
                setEditDraft({ ...editDraft, summary: e.target.value })
              }
            />
          </div>

          <div className="field" style={{ marginTop: "0.75rem" }}>
            <label>Full Description / Body</label>
            <textarea
              rows="6"
              value={editDraft.body}
              onChange={(e) =>
                setEditDraft({ ...editDraft, body: e.target.value })
              }
            />
          </div>

          <div className="field" style={{ marginTop: "0.75rem" }}>
            <label>Cited Sources & References</label>
            <textarea
              rows="3"
              value={editDraft.sourcesAndReferences}
              onChange={(e) =>
                setEditDraft({
                  ...editDraft,
                  sourcesAndReferences: e.target.value,
                })
              }
            />
          </div>

          {selectedSubmission.mediaUrl && (
            <div style={{ marginTop: "0.75rem" }}>
              <strong>Submitted Media Preview:</strong>
              <ImagePreview
                src={selectedSubmission.mediaUrl}
                alt={selectedSubmission.title}
              />
            </div>
          )}

          <div className="field" style={{ marginTop: "0.75rem" }}>
            <label>Private Reviewer Notes (Recorded in Audit Trail)</label>
            <textarea
              rows="2"
              placeholder="Document source verification, oral custodian checks, or requested revisions..."
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.65rem",
              flexWrap: "wrap",
              marginTop: "1rem",
            }}
          >
            <button
              type="button"
              className="btn primary"
              disabled={busy}
              onClick={() => handleApproveOnly(selectedSubmission)}
            >
              1. Approve Submission (Keep Unpublished)
            </button>
            <button
              type="button"
              className="btn earth"
              disabled={busy || selectedSubmission.status !== "Approved"}
              title={
                selectedSubmission.status !== "Approved"
                  ? "Approve the submission first before publishing"
                  : "Publish approved record to public archive"
              }
              onClick={() => handlePublishApproved(selectedSubmission)}
            >
              2. Publish Approved Record to Archive
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() =>
                handleStatusTransition(selectedSubmission, "Needs Correction")
              }
            >
              Request Corrections
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() =>
                handleStatusTransition(selectedSubmission, "Rejected")
              }
            >
              Reject
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() =>
                handleStatusTransition(selectedSubmission, "Archived")
              }
            >
              Archive
            </button>
          </div>

          {Array.isArray(selectedSubmission.revisions) &&
            selectedSubmission.revisions.length > 0 && (
              <div style={{ marginTop: "1.25rem" }}>
                <strong>Revision & Moderation History</strong>
                <ul style={{ marginTop: "0.5rem" }}>
                  {selectedSubmission.revisions.map((rev, idx) => (
                    <li key={idx} style={{ fontSize: "0.88rem" }}>
                      <code>v{rev.version || idx + 1}</code> ·{" "}
                      {readableDate(rev.timestamp)} ·{" "}
                      <strong>{rev.action}</strong> ({rev.previousStatus} →{" "}
                      {rev.newStatus}) by {rev.actor} — {rev.summary}
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </section>
      )}

      {loading ? (
        <p>Loading submissions queue...</p>
      ) : filteredSubmissions.length === 0 ? (
        <div className="card card-body">
          <p className="muted">
            No contributor submissions match the current filters.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Reference & Title</th>
                <th>Type</th>
                <th>Community / State</th>
                <th>Contributor</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <code>{sub.referenceCode}</code>
                    <br />
                    <strong>{sub.title}</strong>
                  </td>
                  <td>{sub.contentType}</td>
                  <td>
                    {sub.ethnicGroup} · {sub.state}
                  </td>
                  <td>{sub.contributorName}</td>
                  <td>
                    <span className="pill">{sub.status}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => openSubmission(sub)}
                    >
                      Inspect & Review
                    </button>{" "}
                    {sub.status !== "Approved" && sub.status !== "Published" && (
                      <button
                        type="button"
                        onClick={() => handleApproveOnly(sub)}
                      >
                        Approve
                      </button>
                    )}{" "}
                    {sub.status === "Approved" && (
                      <button
                        type="button"
                        onClick={() => handlePublishApproved(sub)}
                      >
                        Publish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="section">
        <h2 className="heading">
          Contributor Correction & Takedown Requests ({corrections.length})
        </h2>
        {corrections.length === 0 ? (
          <div className="card card-body">
            <p className="muted">
              No correction or withdrawal requests have been filed.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Target Record</th>
                  <th>Request Type</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {corrections.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <code>{req.referenceCode}</code>
                    </td>
                    <td>{req.referenceOrRecordId}</td>
                    <td>{req.requestType}</td>
                    <td style={{ maxWidth: 360 }}>{req.details}</td>
                    <td>{req.status}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() =>
                          handleResolveCorrection(req, "Resolved")
                        }
                      >
                        Mark Resolved
                      </button>{" "}
                      <button
                        type="button"
                        onClick={() =>
                          handleResolveCorrection(req, "Dismissed")
                        }
                      >
                        Dismiss
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export function ApiDiscoveryAdmin() {
  const { user } = useAuth();
  const [providers, setProviders] = useState(() => getProviderConfigs());
  const [records, setRecords] = useState([]);
  const [syncStatus, setSyncStatus] = useState(() => getSyncStatusSummary());
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);

  async function loadDiscovery() {
    const items = await getAllDiscoveryRecords();
    setRecords(items);
    setProviders(getProviderConfigs());
    setSyncStatus(getSyncStatusSummary());
  }

  useEffect(() => {
    loadDiscovery();
  }, []);

  async function handleSync(providerId = "all") {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await syncExternalHeritageSources({ providerId });
      setRecords(result.records);
      setSyncStatus(result.syncSummary);
      await recordAdminAuditEvent({
        action: "EXTERNAL_API_SYNC",
        targetType: "api_provider",
        targetId: providerId,
        targetTitle: `Synced ${providerId} (${result.newCount} items checked)`,
        adminEmail: user?.email || "admin",
        notes:
          result.errors.length > 0
            ? `Errors: ${result.errors.map((e) => e.message).join("; ")}`
            : "Completed cleanly",
      });
    } catch (error) {
      alert(error.message);
    } finally {
      setSyncing(false);
    }
  }

  function handleToggleProvider(provider) {
    const nextEnabled = !provider.enabled;
    setProviderEnabled(provider.id, nextEnabled);
    setProviders(getProviderConfigs());
    recordAdminAuditEvent({
      action: nextEnabled ? "ENABLE_API_PROVIDER" : "DISABLE_API_PROVIDER",
      targetType: "api_provider",
      targetId: provider.id,
      targetTitle: provider.name,
      adminEmail: user?.email || "admin",
      notes: `Provider ${nextEnabled ? "enabled" : "disabled"} by administrator.`,
    });
  }

  async function handleModerationAction(item, status, trustLevel) {
    await updateExternalDiscoveryDecision(item.id, {
      status,
      isApprovedForPublic: status === "Published",
      trustLevel: trustLevel || item.trustLevel,
      adminEmail: user?.email || "admin",
    });
    await recordAdminAuditEvent({
      action: `API_RECORD_${status.toUpperCase().replace(/\s+/g, "_")}`,
      targetType: "external_discovery",
      targetId: item.id,
      targetTitle: item.title,
      previousStatus: item.status,
      newStatus: status,
      adminEmail: user?.email || "admin",
    });
    await loadDiscovery();
  }

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (providerFilter !== "all" && item.providerId !== providerFilter)
        return false;
      return true;
    });
  }, [records, statusFilter, providerFilter]);

  return (
    <>
      <h1 className="heading">External API Discovery & Source Management</h1>
      <p>
        Manage open-access museum and encyclopedic APIs (The Met Open Access,
        Wikipedia Nigeria Heritage, and Wikimedia Commons). All records pass
        through strict Nigerian relevance filtering and licence verification.
      </p>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "1.25rem",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          className="btn primary"
          disabled={syncing}
          onClick={() => handleSync("all")}
        >
          {syncing
            ? "Syncing Nigerian heritage APIs..."
            : "Sync All Active Providers Now"}
        </button>
        <span className="muted">
          Last sync: {readableDate(syncStatus?.lastSyncAt)} · Failed jobs:{" "}
          {syncStatus?.failedJobsCount || 0}
        </span>
      </div>

      <section className="section">
        <h2 className="heading">Configured Open-Access Providers</h2>
        <div className="grid cards">
          {providers.map((provider) => (
            <div className="card card-body" key={provider.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <strong>{provider.shortName}</strong>
                <span className="pill">
                  {provider.enabled ? "Active" : "Disabled"}
                </span>
              </div>
              <p style={{ fontSize: "0.88rem", marginTop: "0.5rem" }}>
                {provider.description}
              </p>
              <small className="muted">
                Default licence: {provider.defaultLicence}
              </small>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginTop: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleToggleProvider(provider)}
                >
                  {provider.enabled ? "Disable source" : "Enable source"}
                </button>
                {provider.enabled && (
                  <button
                    type="button"
                    className="btn earth"
                    disabled={syncing}
                    onClick={() => handleSync(provider.id)}
                  >
                    Sync source
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <h2 className="heading">
            Discovered Nigerian Heritage Records ({filteredRecords.length})
          </h2>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <select
              aria-label="Filter by provider"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="all">All providers</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.shortName}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by moderation status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="Published">Published (Public)</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Rejected">Irrelevant / Rejected</option>
              <option value="Duplicate">Duplicate</option>
              <option value="Rights-Restricted">Rights-Restricted</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto", marginTop: "1rem" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Artifact / Record</th>
                <th>Source & Accession</th>
                <th>Nigerian Relevance</th>
                <th>Licence</th>
                <th>Status</th>
                <th>Curatorial Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <br />
                    <small>
                      {item.ethnicGroup} · {item.state} ·{" "}
                      {item.historicalPeriod}
                    </small>
                  </td>
                  <td>
                    {item.providerName}
                    <br />
                    <small>
                      {item.accessionNumber || "Open Archive"} ·{" "}
                      <a
                        href={sanitizeHttpUrl(item.sourceUrl, "#")}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Source link
                      </a>
                    </small>
                  </td>
                  <td>
                    Score: {item.relevanceScore}
                    <br />
                    <small>
                      {(item.relevanceSignals || []).slice(0, 4).join(", ")}
                    </small>
                  </td>
                  <td>
                    <small>{item.licence}</small>
                  </td>
                  <td>
                    <span className="pill">{item.status}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        handleModerationAction(
                          item,
                          "Published",
                          "trusted_public"
                        )
                      }
                    >
                      Approve Public
                    </button>{" "}
                    <button
                      type="button"
                      onClick={() =>
                        handleModerationAction(
                          item,
                          "Pending Review",
                          "needs_review"
                        )
                      }
                    >
                      Hold
                    </button>{" "}
                    <button
                      type="button"
                      onClick={() =>
                        handleModerationAction(
                          item,
                          "Rejected",
                          "rejected_non_nigerian"
                        )
                      }
                    >
                      Irrelevant
                    </button>{" "}
                    <button
                      type="button"
                      onClick={() =>
                        handleModerationAction(item, "Duplicate", "duplicate")
                      }
                    >
                      Duplicate
                    </button>{" "}
                    <button
                      type="button"
                      onClick={() =>
                        handleModerationAction(
                          item,
                          "Rights-Restricted",
                          "rights_restricted"
                        )
                      }
                    >
                      Restrict Rights
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export function AuditAdmin() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAuditLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="heading">Administrative Audit Trail</h1>
      <p>
        Chronological record of submission reviews, approvals, publications,
        correction resolutions, and external API moderation decisions.
      </p>
      {loading ? (
        <p>Loading audit trail...</p>
      ) : logs.length === 0 ? (
        <div className="card card-body">
          <p className="muted">
            No administrative moderation actions recorded yet in this session.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Target</th>
                <th>Transition</th>
                <th>Administrator</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry) => (
                <tr key={entry.id}>
                  <td>{readableDate(entry.timestamp)}</td>
                  <td>
                    <code>{entry.action}</code>
                  </td>
                  <td>
                    <strong>{entry.targetTitle || entry.targetId}</strong>
                    <br />
                    <small className="muted">{entry.targetType}</small>
                  </td>
                  <td>
                    {entry.previousStatus
                      ? `${entry.previousStatus} → ${entry.newStatus}`
                      : entry.newStatus || "—"}
                  </td>
                  <td>{entry.adminEmail}</td>
                  <td>{entry.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

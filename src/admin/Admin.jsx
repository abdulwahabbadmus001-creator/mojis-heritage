import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/Auth";

import {
  getAll,
  createItem,
  updateItem,
  removeItem,
  getSiteSettings,
  saveSiteSettings,
} from "../services/content";

import { firebaseReady } from "../firebase";

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
  region: "",
  summary: "",
  body: "",
  coverImage: "",
  youtubeUrl: "",
  isPublished: true,
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

function ImagePreview({ src, alt = "Preview" }) {
  if (!src) return null;

  return (
    <div style={{ marginTop: "0.75rem" }}>
      <img
        src={src}
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

function AdminLayout() {
  const { logout, user } = useAuth();

  const navClass = ({ isActive }) =>
    isActive ? "admin-nav-link active" : "admin-nav-link";

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div>
          <h2 className="heading">Heritage Newsroom</h2>

          <p
            style={{
              fontSize: "0.82rem",
              opacity: 0.8,
              wordBreak: "break-word",
            }}
          >
            {user?.email}
          </p>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          <NavLink end className={navClass} to="/admin">
            Dashboard
          </NavLink>

          <NavLink className={navClass} to="/admin/posts">
            Stories & Posts
          </NavLink>

          <NavLink className={navClass} to="/admin/visit">
            Visit Planner
          </NavLink>

          <NavLink className={navClass} to="/admin/comments">
            Comments
          </NavLink>

          <NavLink className={navClass} to="/admin/settings">
            About & Site Settings
          </NavLink>

          <NavLink className={navClass} to="/admin/analytics">
            Analytics
          </NavLink>
        </nav>

        <hr />

        <Link to="/">View public website</Link>

        <button
          className="btn earth"
          type="button"
          onClick={logout}
          style={{ marginTop: "1rem" }}
        >
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [listings, setListings] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [postData, listingData, commentData] = await Promise.all([
          getAll("posts"),
          getAll("listings"),
          getAll("comments"),
        ]);

        setPosts(postData);
        setListings(listingData);
        setComments(commentData);
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const published = posts.filter((post) => post.isPublished).length;
  const drafts = posts.filter((post) => !post.isPublished).length;

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
        Manage Moji's Heritage stories, destinations, community discussions
        and public information from one newsroom.
      </p>

      <div className="grid cards">
        <div className="card card-body">
          <b>Published stories</b>
          <h2>{published}</h2>
        </div>

        <div className="card card-body">
          <b>Draft stories</b>
          <h2>{drafts}</h2>
        </div>

        <div className="card card-body">
          <b>Visit listings</b>
          <h2>{listings.length}</h2>
        </div>

        <div className="card card-body">
          <b>Pending comments</b>
          <h2>{pendingComments}</h2>
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
          <Link className="btn primary" to="/admin/posts">
            Create a story
          </Link>

          <Link className="btn earth" to="/admin/visit">
            Add destination
          </Link>

          <Link className="btn" to="/admin/comments">
            Moderate comments
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function editPost(post) {
    setForm({
      ...blankPost,
      ...post,
      scheduledDate: post.scheduledDate || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event) {
    event.preventDefault();

    setBusy(true);

    try {
      const data = {
        title: form.title.trim(),
        category: form.category,
        ethnicGroup: form.ethnicGroup.trim(),
        region: form.region,
        summary: form.summary.trim(),
        body: form.body.trim(),
        coverImage: form.coverImage.trim(),
        youtubeUrl: form.youtubeUrl.trim(),
        isPublished: Boolean(form.isPublished),
        scheduledDate: form.scheduledDate || null,
        views: Number(form.views || 0),
      };

      if (!data.title) {
        throw new Error("Please enter a story title.");
      }

      if (!data.body) {
        throw new Error("Please enter the full story.");
      }

      if (form.id) {
        await updateItem("posts", form.id, data);
      } else {
        await createItem("posts", data);
      }

      resetForm();
      await load();

      alert(form.id ? "Story updated." : "Story created.");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(post) {
    try {
      await updateItem("posts", post.id, {
        isPublished: !post.isPublished,
      });

      await load();
    } catch (error) {
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

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;

    return items.filter((item) => item.category === filter);
  }, [items, filter]);

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
            required
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
        </div>

        <div className="field">
          <label>Summary</label>

          <textarea
            required
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
            required
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

          Publish immediately
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
              : "Create story"}
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event) {
    event.preventDefault();

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
          <label>About Us</label>

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
import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  Link,
  useLocation
} from "react-router-dom";

import {
  getSiteSettings
} from "../services/content";

/* ======================================================
   INTERNAL SVG ICON SYSTEM

   All icons in this file are local SVG components.
   This avoids dependency problems with social-brand icons.
====================================================== */

function IconBase({
  children,
  size = 20,
  className = "",
  viewBox = "0 0 24 24"
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ======================================================
   GENERAL ICONS
====================================================== */

function MenuIcon({ size = 21 }) {
  return (
    <IconBase size={size}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </IconBase>
  );
}

function CloseIcon({ size = 21 }) {
  return (
    <IconBase size={size}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </IconBase>
  );
}

function SearchIcon({ size = 18 }) {
  return (
    <IconBase size={size}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </IconBase>
  );
}

function BookmarkIcon({ size = 30 }) {
  return (
    <IconBase size={size}>
      <path d="M6 3h12v18l-6-4-6 4z" />
    </IconBase>
  );
}

function CalendarIcon({ size = 16 }) {
  return (
    <IconBase size={size}>
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />

      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 10h18" />
    </IconBase>
  );
}

function CopyIcon({ size = 18 }) {
  return (
    <IconBase size={size}>
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
      />

      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </IconBase>
  );
}

function ShareIcon({ size = 18 }) {
  return (
    <IconBase size={size}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />

      <path d="m8.6 10.5 6.8-4" />
      <path d="m8.6 13.5 6.8 4" />
    </IconBase>
  );
}

/* ======================================================
   BRAND ICONS

   These are built directly into the component.
   No lucide-react brand imports are required.
====================================================== */

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12.04 2C6.52 2 2.03 6.48 2.03 12c0 1.76.46 3.48 1.33 5L2 22l5.12-1.34A9.94 9.94 0 0 0 12.04 22C17.56 22 22 17.52 22 12S17.56 2 12.04 2Zm0 18.18a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.04.8.81-2.96-.2-.31A8.16 8.16 0 0 1 3.86 12a8.18 8.18 0 1 1 8.18 8.18Zm4.49-6.12c-.25-.12-1.46-.72-1.69-.8-.23-.09-.4-.12-.57.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.57-1.37-.78-1.88-.2-.49-.41-.42-.57-.43h-.49c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.65 4.2 3.72.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.46-.6 1.67-1.17.2-.58.2-1.07.14-1.17-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

function FacebookIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13.5 22v-9h3l.45-3.5H13.5V7.26c0-1.01.28-1.7 1.74-1.7H17.1V2.43A24.9 24.9 0 0 0 14.39 2C11.7 2 9.86 3.64 9.86 6.66V9.5H6.82V13h3.04v9h3.64Z" />
    </svg>
  );
}

function XIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26L22.827 21.75h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function YouTubeIcon({ size = 20 }) {
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

/* ======================================================
   NAVBAR
====================================================== */

export function Navbar() {
  const [open, setOpen] =
    useState(false);

  const location = useLocation();

  const menuRef = useRef(null);

  const channel =
    import.meta.env.VITE_YOUTUBE_CHANNEL_URL ||
    "https://www.youtube.com";

  function closeMenu() {
    setOpen(false);
  }

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  useEffect(() => {
    function handleOutside(event) {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutside
      );
    };
  }, [open]);

  return (
    <header
      className="nav"
      ref={menuRef}
    >
      <div className="container navin">

        <Link
          to="/"
          onClick={closeMenu}
          className="heading brand"
        >
          Moji&apos;s Heritage
        </Link>

        <nav
          className="links"
          aria-label="Main navigation"
        >
          <Link to="/heritage">
            Heritage
          </Link>

          <Link to="/festivals">
            Festivals
          </Link>

          <Link to="/histories">
            Histories
          </Link>

          <Link to="/heroes">
            Heroes
          </Link>

          <Link to="/foods">
            Foods
          </Link>

          <Link to="/languages">
            Languages
          </Link>

          <Link to="/cultures">
            Cultures
          </Link>

          <Link to="/visit">
            Visit
          </Link>

          <a
            href={channel}
            target="_blank"
            rel="noopener noreferrer"
          >
            YouTube ↗
          </a>

          <Link
            to="/search"
            aria-label="Search"
            title="Search"
          >
            <SearchIcon />
          </Link>
        </nav>

        <button
          type="button"
          className="btn nav-menu-button"
          aria-label={
            open
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() =>
            setOpen(
              (current) => !current
            )
          }
        >
          {open ? (
            <CloseIcon />
          ) : (
            <MenuIcon />
          )}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-navigation"
          className="container mobile-menu"
          aria-label="Mobile navigation"
        >
          <Link
            to="/heritage"
            onClick={closeMenu}
          >
            Cultural Heritage
          </Link>

          <Link
            to="/festivals"
            onClick={closeMenu}
          >
            Festivals
          </Link>

          <Link
            to="/calendar"
            onClick={closeMenu}
          >
            Festival Calendar
          </Link>

          <Link
            to="/histories"
            onClick={closeMenu}
          >
            Short Histories
          </Link>

          <Link
            to="/heroes"
            onClick={closeMenu}
          >
            Heroes &amp; Heroines
          </Link>

          <Link
            to="/foods"
            onClick={closeMenu}
          >
            Traditional Foods
          </Link>

          <Link
            to="/languages"
            onClick={closeMenu}
          >
            Languages
          </Link>

          <Link
            to="/gallery"
            onClick={closeMenu}
          >
            Photo Gallery
          </Link>

          <Link
            to="/cultures"
            onClick={closeMenu}
          >
            Explore Cultures
          </Link>

          <Link
            to="/visit"
            onClick={closeMenu}
          >
            Visit Planner
          </Link>

          <Link
            to="/saved"
            onClick={closeMenu}
          >
            Saved Stories
          </Link>

          <Link
            to="/search"
            onClick={closeMenu}
          >
            Search
          </Link>

          <Link
            to="/about"
            onClick={closeMenu}
          >
            About Us
          </Link>

          <Link
            to="/contact"
            onClick={closeMenu}
          >
            Contact Us
          </Link>

          <a
            href={channel}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
          >
            YouTube Channel
          </a>
        </nav>
      )}
    </header>
  );
}

/* ======================================================
   FOOTER
====================================================== */

export function Footer() {
  const [settings, setSettings] =
    useState({});

  const channel =
    import.meta.env.VITE_YOUTUBE_CHANNEL_URL ||
    "https://www.youtube.com";

  useEffect(() => {
    let mounted = true;

    getSiteSettings()
      .then((data) => {
        if (
          mounted &&
          data
        ) {
          setSettings(data);
        }
      })
      .catch(() => {
        /*
         * Firebase/site settings may not
         * be configured yet.
         *
         * Default content remains visible.
         */
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <footer className="footer">
      <div className="container footer-grid">

        <div>
          <h2 className="heading">
            Moji&apos;s Heritage
          </h2>

          <p>
            Preserving and sharing
            Nigeria&apos;s living cultures,
            histories and places.
          </p>

          <a
            href={channel}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-youtube"
          >
            <YouTubeIcon />

            <span>
              Visit our YouTube channel
            </span>
          </a>
        </div>

        <div>
          <b>
            Explore
          </b>

          <div className="footer-links">
            <Link to="/">
              Home
            </Link>

            <Link to="/cultures">
              Cultures
            </Link>

            <Link to="/calendar">
              Festival Calendar
            </Link>

            <Link to="/visit">
              Visit Nigeria
            </Link>

            <Link to="/saved">
              Saved Stories
            </Link>
          </div>
        </div>

        <div>
          <b>
            Organisation
          </b>

          <div className="footer-links">
            <Link to="/about">
              About Us
            </Link>

            <Link to="/privacy">
              Privacy Policy
            </Link>

            <Link to="/contact">
              Contact Us
            </Link>
          </div>
        </div>

        <div>
          <b>
            Our Vision
          </b>

          <p>
            {settings.vision ||
              "Making Nigerian heritage accessible to everyone."}
          </p>
        </div>

        <div>
          <b>
            Our Mission
          </b>

          <p>
            {settings.mission ||
              "Documenting, teaching and sharing Nigeria's living heritage."}
          </p>
        </div>

        <div>
          <b>
            Heritage Membership
          </b>

          <p>
            <span className="tag">
              Coming Soon
            </span>
          </p>

          <small>
            Educational resources,
            heritage events and supporter
            benefits are planned for a
            future phase.
          </small>
        </div>

      </div>

      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()}{" "}
          Moji&apos;s Heritage.
        </span>

        <span>
          Discover Nigeria. Understand
          Our Heritage.
        </span>
      </div>
    </footer>
  );
}


/* ======================================================
   SOCIAL SHARING
====================================================== */

export function Share({
  title,
  compact = false
}) {
  const [copied, setCopied] =
    useState(false);

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : "";

  const encodedUrl =
    encodeURIComponent(currentUrl);

  const encodedTitle =
    encodeURIComponent(
      `${title} — Moji's Heritage`
    );

  const whatsappUrl =
    `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;

  const facebookUrl =
    `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  const xUrl =
    `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;

  async function copyLink() {
    try {
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(
          currentUrl
        );

        setCopied(true);

        window.setTimeout(() => {
          setCopied(false);
        }, 1800);

        return;
      }

      window.prompt(
        "Copy this link:",
        currentUrl
      );
    } catch {
      window.prompt(
        "Copy this link:",
        currentUrl
      );
    }
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title,
        text:
          `Read "${title}" on Moji's Heritage.`,
        url: currentUrl
      });
    } catch {
      /*
       * The user may intentionally cancel
       * the native share window.
       */
    }
  }

  return (
    <div
      className={
        compact
          ? "share-actions compact"
          : "share-actions"
      }
    >
      <span className="share-label">
        Share
      </span>

      {/* WhatsApp */}

      <a
        className="share-button share-whatsapp"
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        title="Share on WhatsApp"
      >
        <span className="share-brand-icon">
          <WhatsAppIcon />
        </span>

        {!compact && (
          <span>
            WhatsApp
          </span>
        )}
      </a>

      {/* Facebook */}

      <a
        className="share-button share-facebook"
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        title="Share on Facebook"
      >
        <span className="share-brand-icon">
          <FacebookIcon />
        </span>

        {!compact && (
          <span>
            Facebook
          </span>
        )}
      </a>

      {/* X */}

      <a
        className="share-button share-x"
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        title="Share on X"
      >
        <span className="share-brand-icon">
          <XIcon />
        </span>

        {!compact && (
          <span>
            X
          </span>
        )}
      </a>

      {/* Copy */}

      <button
        type="button"
        className="share-button share-copy"
        onClick={copyLink}
        aria-label={
          copied
            ? "Link copied"
            : "Copy link"
        }
        title={
          copied
            ? "Link copied"
            : "Copy link"
        }
      >
        <span className="share-brand-icon">
          <CopyIcon />
        </span>

        {!compact && (
          <span>
            {copied
              ? "Copied"
              : "Copy Link"}
          </span>
        )}
      </button>

      {/* Native share */}

      {typeof navigator !==
        "undefined" &&
        navigator.share && (
          <button
            type="button"
            className="share-button share-more"
            onClick={nativeShare}
            aria-label="More sharing options"
            title="More sharing options"
          >
            <span className="share-brand-icon">
              <ShareIcon />
            </span>

            {!compact && (
              <span>
                More
              </span>
            )}
          </button>
        )}
    </div>
  );
}

/* ======================================================
   EMPTY STATE
====================================================== */

export function EmptyState({
  title,
  text,
  action,
  actionLabel
}) {
  return (
    <div className="empty-state">
      <BookmarkIcon />

      <h3 className="heading">
        {title}
      </h3>

      <p className="muted">
        {text}
      </p>

      {action && actionLabel && (
        <Link
          to={action}
          className="btn primary"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

/* ======================================================
   PAGE LOADING
====================================================== */

export function PageLoading({
  text = "Loading…"
}) {
  return (
    <section className="container section">
      <div
        className="loading-state"
        role="status"
        aria-live="polite"
      >
        <div
          className="loader"
          aria-hidden="true"
        />

        <p>
          {text}
        </p>
      </div>
    </section>
  );
}

/* ======================================================
   FESTIVAL BADGE
====================================================== */

export function FestivalBadge() {
  return (
    <span
      className="festival-icon"
      aria-hidden="true"
    >
      <CalendarIcon />
    </span>
  );
}

import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation
} from "react-router-dom";

import { useEffect } from "react";

import { AuthProvider } from "./context/Auth";
import { Navbar, Footer } from "./components/Site";

import {
  Home,
  Category,
  Gallery,
  Post,
  SearchPage,
  Visit,
  VisitDetail,
  About,
  Privacy,
  Contact,
  Cultures,
  CultureDetail,
  FestivalCalendar,
  Saved,
  NotFound
} from "./pages/Public";

import {
  AdminGate,
  Dashboard,
  PostsAdmin,
  ListingsAdmin,
  CommentsAdmin,
  SiteSettings,
  Analytics
} from "./admin/Admin";

/*
----------------------------------
   GLOBAL SCROLL TO TOP
----------------------------------

Whenever the URL changes, automatically move
the visitor to the top of the newly opened page.

This applies to both:
- Public website routes
- Admin dashboard routes
*/
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });
  }, [pathname]);

  return null;
}

/*
----------------------------------
   PUBLIC WEBSITE LAYOUT
----------------------------------
*/
function PublicLayout() {
  return (
    <>
      <Navbar />

      <main>
        <Outlet />
      </main>

      <Footer />
    </>
  );
}

/*
----------------------------------
   APPLICATION ROUTES
----------------------------------
*/
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />

        <Routes>
          {/* =========================
              PUBLIC WEBSITE
          ========================== */}
          <Route element={<PublicLayout />}>
            {/* HOME */}
            <Route
              path="/"
              element={<Home />}
            />

            {/* CULTURAL HERITAGE */}
            <Route
              path="/heritage"
              element={
                <Category
                  category="heritage"
                  title="Cultural Heritage"
                />
              }
            />

            {/* FESTIVALS */}
            <Route
              path="/festivals"
              element={
                <Category
                  category="festivals"
                  title="Festivals"
                />
              }
            />

            {/* DOCUMENTARIES */}
            <Route
              path="/documentaries"
              element={
                <Category
                  category="documentaries"
                  title="Documentaries"
                />
              }
            />

            {/* SHORT HISTORIES */}
            <Route
              path="/histories"
              element={
                <Category
                  category="histories"
                  title="Short Histories"
                />
              }
            />

            {/* HEROES & HEROINES */}
            <Route
              path="/heroes"
              element={
                <Category
                  category="heroes"
                  title="Heroes & Heroines"
                />
              }
            />

            {/* TRADITIONAL FOODS */}
            <Route
              path="/foods"
              element={
                <Category
                  category="foods"
                  title="Traditional Foods"
                />
              }
            />

            {/* LANGUAGES */}
            <Route
              path="/languages"
              element={
                <Category
                  category="languages"
                  title="Languages"
                />
              }
            />

            {/* PHOTO GALLERY */}
            <Route
              path="/gallery"
              element={<Gallery />}
            />

            {/* =========================
                CULTURE DISCOVERY
            ========================== */}
            <Route
              path="/cultures"
              element={<Cultures />}
            />

            <Route
              path="/cultures/:slug"
              element={<CultureDetail />}
            />

            {/* FESTIVAL CALENDAR */}
            <Route
              path="/calendar"
              element={<FestivalCalendar />}
            />

            {/* SAVED ARTICLES */}
            <Route
              path="/saved"
              element={<Saved />}
            />

            {/* =========================
                SEARCH
            ========================== */}
            <Route
              path="/search"
              element={<SearchPage />}
            />

            {/* =========================
                ARTICLES
            ========================== */}
            <Route
              path="/post/:id"
              element={<Post />}
            />

            {/* =========================
                VISIT PLANNER
            ========================== */}
            <Route
              path="/visit"
              element={<Visit />}
            />

            <Route
              path="/visit/:id"
              element={<VisitDetail />}
            />

            {/* =========================
                ORGANISATION
            ========================== */}
            <Route
              path="/about"
              element={<About />}
            />

            <Route
              path="/privacy"
              element={<Privacy />}
            />

            <Route
              path="/contact"
              element={<Contact />}
            />

            {/* =========================
                404
            ========================== */}
            <Route
              path="*"
              element={<NotFound />}
            />
          </Route>

          {/* =========================
              ADMIN NEWSROOM
          ========================== */}
          <Route
            path="/admin"
            element={<AdminGate />}
          >
            {/* ADMIN DASHBOARD */}
            <Route
              index
              element={<Dashboard />}
            />

            {/* STORIES & POSTS */}
            <Route
              path="posts"
              element={<PostsAdmin />}
            />

            {/* VISIT PLANNER */}
            <Route
              path="visit"
              element={<ListingsAdmin />}
            />

            {/* COMMENTS */}
            <Route
              path="comments"
              element={<CommentsAdmin />}
            />

            {/* SITE SETTINGS */}
            <Route
              path="settings"
              element={<SiteSettings />}
            />

            {/* ANALYTICS */}
            <Route
              path="analytics"
              element={<Analytics />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
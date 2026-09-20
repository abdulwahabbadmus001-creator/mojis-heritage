import {
  BrowserRouter,
  Routes,
  Route,
  Outlet
} from "react-router-dom";

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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC WEBSITE */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />

            <Route
              path="/heritage"
              element={
                <Category
                  category="heritage"
                  title="Cultural Heritage"
                />
              }
            />

            <Route
              path="/festivals"
              element={
                <Category
                  category="festivals"
                  title="Festivals"
                />
              }
            />

            <Route
              path="/documentaries"
              element={
                <Category
                  category="documentaries"
                  title="Documentaries"
                />
              }
            />

            <Route
              path="/histories"
              element={
                <Category
                  category="histories"
                  title="Short Histories"
                />
              }
            />

            <Route
              path="/heroes"
              element={
                <Category
                  category="heroes"
                  title="Heroes & Heroines"
                />
              }
            />

            <Route
              path="/foods"
              element={
                <Category
                  category="foods"
                  title="Traditional Foods"
                />
              }
            />

            <Route
              path="/languages"
              element={
                <Category
                  category="languages"
                  title="Languages"
                />
              }
            />

            <Route path="/gallery" element={<Gallery />} />

            {/* DISCOVERY */}
            <Route path="/cultures" element={<Cultures />} />
            <Route
              path="/cultures/:slug"
              element={<CultureDetail />}
            />

            <Route
              path="/calendar"
              element={<FestivalCalendar />}
            />

            <Route path="/saved" element={<Saved />} />

            {/* SEARCH */}
            <Route path="/search" element={<SearchPage />} />

            {/* ARTICLES */}
            <Route path="/post/:id" element={<Post />} />

            {/* VISIT PLANNER */}
            <Route path="/visit" element={<Visit />} />
            <Route
              path="/visit/:id"
              element={<VisitDetail />}
            />

            {/* ORGANISATION */}
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* ADMIN NEWSROOM */}
          <Route path="/admin" element={<AdminGate />}>
            <Route index element={<Dashboard />} />

            <Route
              path="posts"
              element={<PostsAdmin />}
            />

            <Route
              path="visit"
              element={<ListingsAdmin />}
            />

            <Route
              path="comments"
              element={<CommentsAdmin />}
            />

            <Route
              path="settings"
              element={<SiteSettings />}
            />

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
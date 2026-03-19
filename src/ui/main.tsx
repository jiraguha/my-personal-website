import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import "./index.css";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { PostDetail } from "./pages/PostDetail";
import { TalkPresentation } from "./pages/TalkPresentation";
import { TagPage } from "./pages/TagPage";
import { NotFound } from "./pages/NotFound";
import { siteProfile } from "./lib/site";

// Initialize theme before first paint
const stored = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (stored === "dark" || (!stored && prefersDark)) {
  document.documentElement.classList.add("dark");
}

function Layout() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Nav profile={siteProfile} />
      <main><Outlet /></main>
      <Footer profile={siteProfile} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Full-viewport routes — no nav/footer */}
        <Route path="/talks/:slug" element={<TalkPresentation />} />

        {/* Standard layout routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/posts/:slug" element={<PostDetail />} />
          <Route path="/tags/:tag" element={<TagPage />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

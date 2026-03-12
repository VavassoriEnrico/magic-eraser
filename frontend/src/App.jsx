import { useEffect, useMemo, useState } from "react";

import AppLayout from "./components/layout/AppLayout";

import GalleryPage from "./pages/galleryPage";
import HomePage from "./pages/homePage";
import ProfilePage from "./pages/profilePage";

function normalizePath(pathname) {
  if (!pathname) return "/";
  return pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(normalizePath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(path) {
    const nextPath = normalizePath(path);
    if (nextPath === currentPath) return;
    window.history.pushState({}, "", nextPath);
    setCurrentPath(nextPath);
  }

  const page = useMemo(() => {
    switch (currentPath) {
      case "/":
        return <HomePage />;
      case "/gallery":
        return <GalleryPage />;
      case "/profile":
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  }, [currentPath]);

  return (
    <AppLayout currentPath={currentPath} onNavigate={navigate}>
      {page}
    </AppLayout>
  );
}

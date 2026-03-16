import { useEffect, useMemo, useState } from "react";

import AppLayout from "./components/layout/AppLayout";
import GalleryPage from "./pages/galleryPage";
import HomePage from "./pages/homePage";
import ProfilePage from "./pages/profilePage";

type AppPath = "/" | "/gallery" | "/profile";

function normalizePath(pathname: string): AppPath {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const normalized =
    pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  switch (normalized) {
    case "/gallery":
      return "/gallery";
    case "/profile":
      return "/profile";
    default:
      return "/";
  }
}

export default function App() {
  const [currentPath, setCurrentPath] = useState<AppPath>(() =>
    normalizePath(window.location.pathname)
  );

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(normalizePath(window.location.pathname));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(path: AppPath) {
    const nextPath = normalizePath(path);
    if (nextPath === currentPath) {
      return;
    }

    window.history.pushState({}, "", nextPath);
    setCurrentPath(nextPath);
  }

  const page = useMemo(() => {
    switch (currentPath) {
      case "/gallery":
        return <GalleryPage />;
      case "/profile":
        return <ProfilePage />;
      case "/":
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

import { useEffect, useMemo, useState } from "react";

import AppLayout from "./components/layout/AppLayout";
import GalleryPage from "./pages/galleryPage";
import HomePage from "./pages/homePage";
import LaboratoryPage from "./pages/laboratoryPage";
import LoginPage from "./pages/loginPage";
import PipelinesPage from "./pages/pipelinesPage";
import ProfilePage from "./pages/profilePage";
import SignupPage from "./pages/signupPage";

type AppPath =
  | "/"
  | "/gallery"
  | "/pipelines"
  | "/profile"
  | "/laboratory"
  | "/login"
  | "/signup";

function normalizePath(pathname: string): AppPath {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const normalized =
    pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  switch (normalized) {
    case "/gallery":
      return "/gallery";
    case "/pipelines":
      return "/pipelines";
    case "/profile":
      return "/profile";
    case "/laboratory":
      return "/laboratory";
    case "/login":
      return "/login";
    case "/signup":
      return "/signup";
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

  function navigate(path: AppPath, search = "") {
    const nextPath = normalizePath(path);
    const normalizedSearch = search.startsWith("?") || search === "" ? search : `?${search}`;
    const currentSearch = window.location.search ?? "";
    if (nextPath === currentPath && normalizedSearch === currentSearch) {
      return;
    }

    window.history.pushState({}, "", `${nextPath}${normalizedSearch}`);
    setCurrentPath(nextPath);
  }

  const page = useMemo(() => {
    switch (currentPath) {
      case "/gallery":
        return <GalleryPage />;
      case "/pipelines":
        return <PipelinesPage />;
      case "/profile":
        return <ProfilePage />;
      case "/laboratory":
        return <LaboratoryPage />;
      case "/login":
        return <LoginPage />;
      case "/signup":
        return <SignupPage />;
      case "/":
      default:
        return <HomePage />;
    }
  }, [currentPath]);

  if (currentPath === "/login" || currentPath === "/signup") {
    return <>{page}</>;
  }

  return (
    <AppLayout currentPath={currentPath} onNavigate={navigate}>
      {page}
    </AppLayout>
  );
}

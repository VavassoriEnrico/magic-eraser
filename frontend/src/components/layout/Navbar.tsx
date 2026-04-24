import { useEffect, useState, type MouseEvent } from "react";

import { IconButton, useColorMode } from "@chakra-ui/react";
import {
  BiBookContent,
  BiHomeAlt2,
  BiSolidMoon,
  BiSolidSun,
  BiUserCircle,
  BiWrench,
} from "react-icons/bi";

import logoBlack from "../../assets/me_logo_black.png";
import logoWhite from "../../assets/me_logo_white.png";
import type { AppPath } from "../../types/ui";

interface NavbarProps {
  currentPath: AppPath;
  onNavigate: (path: AppPath, search?: string) => void;
}

export default function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const { colorMode, toggleColorMode } = useColorMode();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const titleLabel = "Magic Eraser";
  const logoSource = colorMode === "dark" ? logoWhite : logoBlack;
  const loginLabel = "Login";
  const profileLabel = "Profile";
  const navigationItems: Array<{ path: AppPath; label: string; icon: JSX.Element }> = [
    { path: "/", label: "Home", icon: <BiHomeAlt2 /> },
    { path: "/pipelines", label: "Pipelines", icon: <BiBookContent /> },
    { path: "/laboratory", label: "Laboratory", icon: <BiWrench /> },
  ];

  useEffect(() => {
    const checkAuth = () => setIsLoggedIn(hasSupabaseSession());
    checkAuth();

    window.addEventListener("storage", checkAuth);
    window.addEventListener("focus", checkAuth);
    window.addEventListener("popstate", checkAuth);
    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("focus", checkAuth);
      window.removeEventListener("popstate", checkAuth);
    };
  }, []);

  return (
    <>
      <header className="app-topbar">
        <a
          href="/"
          className="app-topbar__brand"
          onClick={(event) => onLinkClick(event, "/", onNavigate)}
          aria-label={titleLabel}
        >
          <img className="app-topbar__logo-image" src={logoSource} alt={titleLabel} />
        </a>

        <nav className="app-topbar__nav" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={navClass(currentPath === item.path)}
              onClick={(event) =>
                onLinkClick(
                  event,
                  item.path,
                  onNavigate,
                  item.path === "/laboratory" ? getLaboratorySearch() : ""
                )
              }
            >
              <span className="app-topbar__link-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="app-topbar__actions">
          <IconButton
            size="sm"
            variant="outline"
            onClick={toggleColorMode}
            className="app-topbar__theme-btn"
            aria-label={colorMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            icon={
              <span aria-hidden="true">
                {colorMode === "dark" ? <BiSolidSun /> : <BiSolidMoon />}
              </span>
            }
          />

          {isLoggedIn ? (
            <a
              href="/profile"
              className="app-topbar__profile"
              onClick={(event) => onLinkClick(event, "/profile", onNavigate)}
            >
              <span>{profileLabel}</span>
              <span className="app-topbar__avatar" aria-hidden="true" />
            </a>
          ) : (
            <a
              href="/login"
              className="app-topbar__profile app-topbar__login-btn"
              onClick={(event) => onLinkClick(event, "/login", onNavigate)}
            >
              <span className="app-topbar__link-icon" aria-hidden="true">
                <BiUserCircle />
              </span>
              <span>{loginLabel}</span>
            </a>
          )}
        </div>
      </header>
    </>
  );
}

function navClass(isActive: boolean) {
  return `app-topbar__link${isActive ? " is-active" : ""}`;
}

function onLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  path: AppPath,
  onNavigate: (path: AppPath, search?: string) => void,
  search = "",
) {
  event.preventDefault();
  onNavigate(path, search);
}

function getLaboratorySearch() {
  try {
    const raw = window.sessionStorage.getItem("laboratory:selected-image");
    if (!raw) {
      return "";
    }

    const parsed = JSON.parse(raw) as { id?: string | number; project_id?: string | number };
    if (!parsed.id || !parsed.project_id) {
      return "";
    }

    const params = new URLSearchParams({
      projectId: String(parsed.project_id),
      imageId: String(parsed.id),
    });
    return `?${params.toString()}`;
  } catch {
    return "";
  }
}

function hasSupabaseSession() {
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) {
        continue;
      }

      const raw = window.localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw) as { access_token?: string };
      if (parsed?.access_token) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

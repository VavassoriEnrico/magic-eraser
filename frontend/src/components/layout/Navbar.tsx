import { useEffect, useState, type MouseEvent } from "react";

import { IconButton, useColorMode } from "@chakra-ui/react";
import { BiSolidMoon, BiSolidSun } from "react-icons/bi";
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
  const homeLabel = "Home";
  const pipelinesLabel = "Pipelines";
  const loginLabel = "Login";
  const profileLabel = "Profile";

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
    <header className="app-navbar">
      <div className="app-navbar__inner">
        <a
          href="/"
          className="app-navbar__brand"
          onClick={(event) => onLinkClick(event, "/", onNavigate)}
          aria-label={titleLabel}
        >
          <img className="app-navbar__logo-image" src={logoSource} alt={titleLabel} />
        </a>

        <nav className="app-navbar__nav" aria-label="Main navigation">
          <a
            href="/"
            className={navClass(currentPath === "/")}
            onClick={(event) => onLinkClick(event, "/", onNavigate)}
          >
            {homeLabel}
          </a>
          <a
            href="/pipelines"
            className={navClass(currentPath === "/pipelines")}
            onClick={(event) => onLinkClick(event, "/pipelines", onNavigate)}
          >
            {pipelinesLabel}
          </a>
        </nav>

        <div className="app-navbar__actions">
          <IconButton
            size="sm"
            variant="outline"
            onClick={toggleColorMode}
            className="app-navbar__theme-btn"
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
              className="app-navbar__profile"
              onClick={(event) => onLinkClick(event, "/profile", onNavigate)}
            >
              <span>{profileLabel}</span>
              <span className="app-navbar__avatar" aria-hidden="true" />
            </a>
          ) : (
            <a
              href="/login"
              className="app-navbar__login-btn"
              onClick={(event) => onLinkClick(event, "/login", onNavigate)}
            >
              {loginLabel}
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

function navClass(isActive: boolean) {
  return `app-navbar__link${isActive ? " is-active" : ""}`;
}

function onLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  path: AppPath,
  onNavigate: (path: AppPath, search?: string) => void
) {
  event.preventDefault();
  onNavigate(path);
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

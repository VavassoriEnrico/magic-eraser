import type { MouseEvent } from "react";

import { IconButton, useColorMode } from "@chakra-ui/react";
import { BiSolidMoon, BiSolidSun } from "react-icons/bi";

type AppPath = "/" | "/gallery" | "/profile";

interface NavbarProps {
  currentPath: AppPath;
  onNavigate: (path: AppPath) => void;
}

export default function Navbar({ currentPath, onNavigate }: NavbarProps) {
  const { colorMode, toggleColorMode } = useColorMode();

  const titleLabel = "Magic Eraser";
  const homeLabel = "Home";
  const galleryLabel = "Gallery";
  const profileLabel = "Profile";

  return (
    <header className="app-navbar">
      <div className="app-navbar__inner">
        <a
          href="/"
          className="app-navbar__brand"
          onClick={(event) => onLinkClick(event, "/", onNavigate)}
        >
          <span className="app-navbar__logo">◈</span>
          <span>{titleLabel}</span>
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
            href="/gallery"
            className={navClass(currentPath === "/gallery")}
            onClick={(event) => onLinkClick(event, "/gallery", onNavigate)}
          >
            {galleryLabel}
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
          <a
            href="/profile"
            className="app-navbar__profile"
            onClick={(event) => onLinkClick(event, "/profile", onNavigate)}
          >
            <span>{profileLabel}</span>
            <span className="app-navbar__avatar" aria-hidden="true" />
          </a>
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
  onNavigate: (path: AppPath) => void
) {
  event.preventDefault();
  onNavigate(path);
}

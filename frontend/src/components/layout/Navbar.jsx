import { IconButton, useColorMode } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <header className="app-navbar">
      <div className="app-navbar__inner">
        <NavLink to="/" className="app-navbar__brand">
          <span className="app-navbar__logo">◈</span>
          <span>Magic Eraser</span>
        </NavLink>

        <nav className="app-navbar__nav" aria-label="Main navigation">
          <NavLink to="/" className={({ isActive }) => navClass(isActive)}>
            Home
          </NavLink>
          <NavLink to="/gallery" className={({ isActive }) => navClass(isActive)}>
            Gallery
          </NavLink>
        </nav>

        <div className="app-navbar__actions">
          <IconButton
            size="sm"
            variant="outline"
            onClick={toggleColorMode}
            className="app-navbar__theme-btn"
            aria-label={colorMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            icon={<span aria-hidden="true">{colorMode === "dark" ? "☀" : "🌙"}</span>}
          />
          <NavLink to="/profile" className="app-navbar__profile">
            <span>Profile</span>
            <span className="app-navbar__avatar" aria-hidden="true" />
          </NavLink>
        </div>
      </div>
    </header>
  );
}

function navClass(isActive) {
  return `app-navbar__link${isActive ? " is-active" : ""}`;
}

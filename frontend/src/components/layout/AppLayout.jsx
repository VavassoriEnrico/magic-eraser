import Navbar from "./Navbar";
import Footbar from "./Footbar";

export default function AppLayout({ children, currentPath, onNavigate }) {
  return (
    <div className="app-shell">
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />
      <main className="app-shell__content">{children}</main>
      <Footbar />
    </div>
  );
}

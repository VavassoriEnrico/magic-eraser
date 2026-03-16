import Navbar from "./Navbar";
import Footbar from "./Footbar";
import type { AppLayoutProps } from "../../types/ui";

export default function AppLayout({
  children,
  currentPath,
  onNavigate,
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />
      <main className="app-shell__content">{children}</main>
      <Footbar />
    </div>
  );
}

import Navbar from "./Navbar";
import Footbar from "./Footbar";

export default function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-shell__content">{children}</main>
      <Footbar />
    </div>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";

import GalleryPage from "./pages/galleryPage";
import HomePage from "./pages/homePage";
import ProfilePage from "./pages/profilePage";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

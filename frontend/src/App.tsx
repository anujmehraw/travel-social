
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Communities from "./pages/Communities";
import Chats from "./pages/Chats";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Saved from "./pages/Saved";
import CommunityPage from "./pages/CommunityPage";

function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="text-3xl font-semibold text-stone-900">
        Page not found
      </h1>
      <p className="mt-3 text-stone-500">
        This page doesn't exist yet.
      </p>
      <a
        href="/"
        className="mt-6 inline-block rounded-xl bg-orange-800 px-5 py-3 text-sm font-medium text-white"
      >
        Return home
      </a>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#faf9f6]">
        <Navbar />

        <div className="min-w-0 lg:ml-64">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/communities/:slug" element={<CommunityPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>

          <footer className="mt-10 border-t border-stone-200 bg-white px-6 py-5 text-sm text-stone-500">
            Travel Social · Discover places. Share experiences. Travel together.
          </footer>
        </div>
      </div>
    </BrowserRouter>
  );
}

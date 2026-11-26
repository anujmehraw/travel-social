
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";

import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Communities from "./pages/Communities";
import Rooms from "./pages/Rooms";
import RoomPage from "./pages/RoomPage";
import Chats from "./pages/Chats";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Saved from "./pages/Saved";
import CommunityPage from "./pages/CommunityPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

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

// Layout for authenticated users
function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f7f5ef]">
      <Navbar />

      <div className="min-w-0 lg:ml-60">
        <Outlet />

        <footer className="mt-12 border-t border-[#dedbd3] px-6 py-6 text-xs text-stone-500 sm:px-8">
          <div className="mx-auto max-w-6xl">
            Travel Social <span className="mx-2 text-stone-300">/</span> Discover places. Share experiences. Travel together.
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public route */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/rooms/:roomId" element={<RoomPage />} />
              <Route path="/chats" element={<Chats />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/communities/:slug" element={<CommunityPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

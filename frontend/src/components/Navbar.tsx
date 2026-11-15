
import { NavLink } from "react-router-dom";
import {
  House,
  Compass,
  Users,
  MessageCircle,
  Bell,
  Bookmark,
  UserRound,
  Map,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const mainLinks = [
  { label: "Home", to: "/", icon: House },
  { label: "Discover", to: "/discover", icon: Compass },
  { label: "Communities", to: "/communities", icon: Users },
  { label: "Chats", to: "/chats", icon: MessageCircle },
  { label: "Notifications", to: "/notifications", icon: Bell },
];

const personalLinks = [
  { label: "Saved stories", to: "/saved", icon: Bookmark },
  { label: "My profile", to: "/profile", icon: UserRound },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <NavLink
        to="/"
        onClick={() => setMobileOpen(false)}
        className="mb-7 flex items-center gap-3 px-2"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-800 text-white">
          <Map size={22} />
        </span>
        <span className="text-xl font-bold tracking-tight text-stone-900">
          travel<span className="text-orange-800">social</span>
        </span>
      </NavLink>

      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
        Menu
      </p>

      <nav className="space-y-1">
        {mainLinks.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                isActive
                  ? "bg-orange-50 font-semibold text-orange-900"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`
            }
          >
            <Icon size={19} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="my-6 border-t border-stone-200" />

      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
        Your space
      </p>

      <nav className="space-y-1">
        {personalLinks.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                isActive
                  ? "bg-orange-50 font-semibold text-orange-900"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`
            }
          >
            <Icon size={19} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 rounded-2xl bg-stone-100 p-4">
        <p className="text-sm font-semibold text-stone-800">
          Know a place well?
        </p>
        <p className="mt-2 text-xs leading-5 text-stone-500">
          Share local tips and help someone plan their next trip.
        </p>
        <NavLink
          to="/"
          onClick={() => setMobileOpen(false)}
          className="mt-3 inline-block text-sm font-semibold text-orange-800"
        >
          Share a story →
        </NavLink>
      </div>

      <p className="mt-auto px-2 pt-8 text-xs text-stone-400">
        Travel Social · Discover together
      </p>
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto border-r border-stone-200 bg-white px-5 py-6 lg:flex">
        {sidebarContent}
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 lg:hidden">
        <NavLink to="/" className="flex items-center gap-2">
          <Map size={23} className="text-orange-800" />
          <span className="font-bold text-stone-900">
            travel<span className="text-orange-800">social</span>
          </span>
        </NavLink>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
          className="rounded-lg p-2 text-stone-700 hover:bg-stone-100"
        >
          {mobileOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 lg:hidden">
          <aside className="flex h-full w-72 flex-col overflow-y-auto bg-white p-5">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="mb-5 self-end rounded-lg p-2 hover:bg-stone-100"
            >
              <X size={22} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

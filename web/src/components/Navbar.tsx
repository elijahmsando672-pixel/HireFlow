import { Link, useLocation } from "react-router-dom";
import { Briefcase, FolderKanban, Handshake, Inbox, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { initials } from "../lib/format";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Briefcase },
  { to: "/jobs", label: "Jobs", icon: FolderKanban },
  { to: "/gigs", label: "Gigs", icon: Sparkles },
  { to: "/contracts", label: "Contracts", icon: Handshake },
  { to: "/messages", label: "Messages", icon: Inbox }
];

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + "/");

  const role = user?.role || "both";
  const isClient = role === "client" || role === "both";
  const isFreelancer = role === "freelancer" || role === "both";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">
            HF
          </span>
          <span className="text-lg font-black tracking-tight text-slate-900">
            Hire<span className="text-indigo-600">Flow</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive(item.to) ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            {isFreelancer && (
              <Link
                to="/create-gig"
                className="hidden rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 sm:block"
              >
                Sell your skills
              </Link>
            )}
            {isClient && (
              <Link
                to="/post-job"
                className="hidden rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 lg:block"
              >
                Post a job
              </Link>
            )}
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
              {initials(user.firstName, user.lastName)}
            </span>
            <button
              onClick={logout}
              title="Log out"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>

      <nav className="flex items-center justify-around border-t border-slate-100 bg-white px-2 py-1 md:hidden">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                active ? "text-indigo-700" : "text-slate-500"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 sm:px-6">
          © {new Date().getFullYear()} HireFlow — a full-stack freelancing platform.
        </div>
      </footer>
    </div>
  );
}

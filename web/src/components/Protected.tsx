import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "./Navbar";

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
}

function useGate() {
  const { user, loading } = useAuth();
  if (loading) return { ready: false, allowed: false };
  return { ready: true, allowed: !!user };
}

export function Protected() {
  const { ready, allowed } = useGate();

  if (!ready) return <Spinner />;
  if (!allowed) return <Navigate to="/login" replace />;

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

export function ProtectedCentered() {
  const { ready, allowed } = useGate();

  if (!ready) return <Spinner />;
  if (!allowed) return <Navigate to="/login" replace />;

  return <Outlet />;
}

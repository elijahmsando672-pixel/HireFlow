import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";

export default function Interview() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={36} className="text-emerald-500" />
        </div>
        <h1 className="mt-6 text-2xl font-black text-slate-900">You're all set{user ? ", " + user.firstName : ""}!</h1>
        <p className="mt-2 text-sm text-slate-500">Your profile is complete. You can now browse jobs, send proposals and sell gigs.</p>

        <div className="mt-8 space-y-3 text-left">
          {[
            "Browse and apply for jobs",
            "Send proposals with rates and timelines",
            "Create gigs and start selling"
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <CheckCircle2 size={16} className="shrink-0 text-indigo-600" />
              {item}
            </div>
          ))}
        </div>

        <Link to="/dashboard" className="mt-8 block">
          <Button className="w-full" size="lg">
            Go to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Button } from "../components/Button";
import { Field, TextInput } from "../components/Field";

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.phone || "");
  const [education, setEducation] = useState(user?.education || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api.updateProfile({ phone, education });
      setUser(data.user);
      navigate("/add-bio");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-black text-white">
            {user ? user.firstName.charAt(0) : "?"}
          </span>
          <h1 className="mt-4 text-2xl font-black text-slate-900">Let's get to know you</h1>
          <p className="mt-1 text-sm text-slate-500">Step 1 of 2 — contact & background</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <Field label="Phone number">
            <div className="relative">
              <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <TextInput type="tel" placeholder="+254 7xx xxx xxx" className="pl-10" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </Field>

          <Field label="Education" hint="Where did you study, and what did you take?">
            <div className="relative">
              <GraduationCap size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <TextInput placeholder="e.g. BSc Computer Science, University of Nairobi" className="pl-10" value={education} onChange={(e) => setEducation(e.target.value)} />
            </div>
          </Field>

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Saving…" : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}

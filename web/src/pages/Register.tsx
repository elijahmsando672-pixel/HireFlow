import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Lock, Mail, User, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { Field, TextInput } from "../components/Field";
import type { Role } from "../lib/types";

const ROLE_OPTIONS: { value: Role; label: string; description: string; icon: typeof Briefcase }[] = [
  { value: "client", label: "Client", description: "I want to hire freelancers and post jobs", icon: Briefcase },
  { value: "freelancer", label: "Freelancer", description: "I want to apply to jobs and sell gigs", icon: UserPlus },
  { value: "both", label: "Both", description: "I hire and freelance on HireFlow", icon: User }
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", email: "", phone: "", password: "", role: "both" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate("/onboarding");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-base font-black text-white">HF</span>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Hire<span className="text-indigo-600">Flow</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-black text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Join HireFlow in under a minute</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <Field label="How will you use HireFlow?">
            <div className="grid gap-2.5">
              {ROLE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = form.role === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: option.value })}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                      active ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-slate-900">{option.label}</span>
                      <span className="block text-xs text-slate-500">{option.description}</span>
                    </span>
                    <span
                      className={`mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        active ? "border-indigo-600" : "border-slate-300"
                      }`}
                    >
                      {active && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="First name">
              <TextInput required placeholder="Jane" value={form.firstName} onChange={set("firstName")} />
            </Field>
            <Field label="Last name">
              <TextInput required placeholder="Doe" value={form.lastName} onChange={set("lastName")} />
            </Field>
          </div>

          <Field label="Username" hint="Optional — how people know you on HireFlow">
            <div className="relative">
              <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <TextInput placeholder="@jane" className="pl-10" value={form.username} onChange={set("username")} />
            </div>
          </Field>

          <Field label="Email">
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <TextInput type="email" required autoComplete="email" placeholder="you@example.com" className="pl-10" value={form.email} onChange={set("email")} />
            </div>
          </Field>

          <Field label="Phone">
            <TextInput type="tel" placeholder="+254 7xx xxx xxx" value={form.phone} onChange={set("phone")} />
          </Field>

          <Field label="Password" hint="At least 8 characters">
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <TextInput type="password" required autoComplete="new-password" placeholder="••••••••" className="pl-10" value={form.password} onChange={set("password")} />
            </div>
          </Field>

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

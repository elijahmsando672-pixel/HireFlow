import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, KeyRound, Mail } from "lucide-react";
import { Button } from "../components/Button";
import { Field, TextInput } from "../components/Field";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 size={36} className="text-emerald-500" />
          </div>
          <h1 className="mt-6 text-2xl font-black text-slate-900">Check your inbox</h1>
          <p className="mt-2 text-sm text-slate-500">
            If an account exists for <span className="font-semibold text-slate-900">{email}</span>, we've sent a reset
            link. (Demo app — no email is actually sent.)
          </p>
          <Link to="/login" className="mt-8 block">
            <Button variant="secondary" className="w-full">
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
          <div className="mt-6 mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
            <KeyRound size={24} className="text-indigo-600" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">Forgot password?</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your email and we'll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <Field label="Email address">
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <TextInput type="email" required placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </Field>

          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

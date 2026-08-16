import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, MessageSquare, ShieldCheck, Sparkles, Star, TrendingUp, UserPlus } from "lucide-react";

const features = [
  {
    icon: Briefcase,
    title: "Post jobs, get proposals",
    text: "Describe what you need and freelancers pitch with their rate and timeline.",
    color: "bg-indigo-50 text-indigo-600"
  },
  {
    icon: Sparkles,
    title: "Sell gigs with packages",
    text: "Turn your skills into gigs with Basic, Standard and Premium pricing.",
    color: "bg-violet-50 text-violet-600"
  },
  {
    icon: MessageSquare,
    title: "Built-in messaging",
    text: "Chat with clients and freelancers before and during the work.",
    color: "bg-amber-50 text-amber-600"
  },
  {
    icon: ShieldCheck,
    title: "Reviews & ratings",
    text: "Build trust with verified reviews on every completed order.",
    color: "bg-emerald-50 text-emerald-600"
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">HF</span>
            <span className="text-lg font-black tracking-tight text-slate-900">
              Hire<span className="text-indigo-600">Flow</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/jobs" className="hidden text-sm font-semibold text-slate-600 hover:text-slate-900 sm:block">
              Browse jobs
            </Link>
            <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-200">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              Kenya's freelancing marketplace
            </p>
            <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              Hire talent.{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Sell your skills.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              HireFlow connects clients with top freelancers. Post jobs, send proposals,
              buy gigs and chat with clients — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
              >
                <UserPlus size={18} />
                Get started free
              </Link>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-base font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                Browse jobs
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-slate-400">
              <div>
                <p className="text-2xl font-black text-white">10K+</p>
                <p className="text-sm">Active users</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">2K+</p>
                <p className="text-sm">Jobs posted</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">4.9</p>
                <p className="text-sm">Average rating</p>
              </div>
            </div>
          </div>

          {/* Hero card mock */}
          <div className="hidden items-center lg:flex">
            <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <div className="rounded-xl bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Software</span>
                  <span className="text-xs text-slate-400">Frontend Developer</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-slate-900">Frontend Developer</h3>
                <p className="text-sm font-semibold text-indigo-700">Savanna Labs</p>
                <p className="mt-3 text-sm text-slate-500">
                  Build responsive, accessible web applications using HTML, CSS and vanilla JavaScript...
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-bold text-slate-900">KSh 120,000</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">3 proposals</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/10 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">HF</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Design a logo & brand kit</p>
                  <p className="text-xs text-slate-400">Design · Starting at KSh 1,500</p>
                </div>
                <TrendingUp size={18} className="text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Everything you need to get work done</h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-500">
            A complete freelancing platform — from posting a job to collecting a review.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${f.color}`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">How it works</h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              { n: "1", title: "Create your profile", text: "Sign up for free and showcase your skills, experience and portfolio." },
              { n: "2", title: "Find or sell work", text: "Apply to jobs, propose on projects, or create gigs that sell themselves." },
              { n: "3", title: "Get reviewed", text: "Complete orders and build a reputation that wins you more work." }
            ].map((step) => (
              <div key={step.n} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-black text-white">
                  {step.n}
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-16 text-center">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Ready to start freelancing?</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-indigo-100">
            Join thousands of freelancers and clients already using HireFlow.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
          >
            Create your free account
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white">HF</span>
            <span className="font-black text-slate-900">
              Hire<span className="text-indigo-600">Flow</span>
            </span>
          </div>
          <p>© {new Date().getFullYear()} HireFlow. A full-stack freelancing platform.</p>
        </div>
      </footer>
    </div>
  );
}

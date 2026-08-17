import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, MapPin, Lock, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";
import type { Job } from "../lib/types";
import { formatSalary, timeAgo } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { CategoryBadge } from "../components/CategoryBadge";
import { SaveButton } from "../components/SaveButton";
import { Button } from "../components/Button";
import { Field, TextArea, TextInput } from "../components/Field";

export default function JobDetails() {
  const { id } = useParams();
  const jobId = parseInt(id || "0", 10);
  const { user, subscriptionStatus } = useAuth();

  if (!id || isNaN(jobId) || jobId <= 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-500">Invalid job ID.</p>
        <Link to="/jobs" className="mt-4 inline-block font-semibold text-indigo-600 hover:text-indigo-700">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [coverLetter, setCoverLetter] = useState("");
  const [rate, setRate] = useState("");
  const [timelineDays, setTimelineDays] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .getJob(jobId)
      .then((data) => !cancelled && setJob(data.job))
      .catch((err) => !cancelled && setError((err as Error).message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const isOwner = user && job?.postedBy === user.id;
  const isPro = subscriptionStatus?.plan === "PRO" && subscriptionStatus?.isActive;
  const role = user?.role || "both";

  const handleProposal = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await api.createProposal({
        jobId,
        coverLetter,
        rate: parseInt(rate, 10),
        timelineDays: parseInt(timelineDays, 10)
      });
      setSubmitted(true);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-500">{error || "Job not found."}</p>
        <Link to="/jobs" className="mt-4 inline-block font-semibold text-indigo-600 hover:text-indigo-700">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <Link to="/jobs" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to jobs
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CategoryBadge category={job.category} />
                  <span className="text-xs text-slate-400">Posted {timeAgo(job.posted)}</span>
                </div>
                <h1 className="mt-3 text-2xl font-black text-slate-900 sm:text-3xl">{job.title}</h1>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-base font-semibold text-indigo-700">{job.company}</p>
                  {job.posterVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <ShieldCheck size={12} />
                      Verified Employer
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={15} /> {job.location}
                  </span>
                  <span>{job.type}</span>
                  <span className="font-semibold text-slate-900">{formatSalary(job.salary)}</span>
                  <span className="text-slate-400">
                    {job.proposalCount || 0} proposal{(job.proposalCount || 0) === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              {user && !isOwner && <SaveButton type="job" id={job.id} />}
            </div>

            <hr className="my-6 border-slate-100" />

            <h2 className="text-lg font-bold text-slate-900">About this job</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{job.description}</p>

            {job.requirements && job.requirements.length > 0 && (
              <>
                <h2 className="mt-8 text-lg font-bold text-slate-900">Requirements</h2>
                <ul className="mt-3 space-y-2.5">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-600">
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {isOwner && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">This is your job</h3>
              <p className="mt-1 text-sm text-slate-500">Review proposals from freelancers and accept the best fit.</p>
              <Link to={`/jobs/${job.id}/proposals`} className="mt-4 block">
                <Button className="w-full">View proposals ({job.proposalCount || 0})</Button>
              </Link>
            </div>
          )}

          {(!isOwner && user && (role === "freelancer" || role === "both")) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {submitted ? (
                <div className="text-center">
                  <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
                  <h3 className="mt-3 text-base font-bold text-slate-900">Proposal sent!</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    The client can now review your proposal. Track its status in{" "}
                    <Link to="/my-proposals" className="font-semibold text-indigo-600">
                      My proposals
                    </Link>
                    .
                  </p>
                </div>
              ) : isPro ? (
                <form onSubmit={handleProposal} className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Apply for this job</h3>
                  {formError && <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{formError}</div>}
                  <Field label="Proposed rate (KSh)">
                    <TextInput type="number" min={0} required placeholder="e.g. 30000" value={rate} onChange={(e) => setRate(e.target.value)} />
                  </Field>
                  <Field label="Delivery timeline (days)">
                    <TextInput type="number" min={1} required placeholder="e.g. 14" value={timelineDays} onChange={(e) => setTimelineDays(e.target.value)} />
                  </Field>
                  <Field label="Cover letter">
                    <TextArea rows={5} required placeholder="Why are you a good fit for this job?" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
                  </Field>
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "Sending…" : "Submit proposal"}
                  </Button>
                </form>
              ) : (
                <div className="text-center">
                  <Lock className="mx-auto h-10 w-10 text-indigo-600" />
                  <h3 className="mt-3 text-base font-bold text-slate-900">Pro Feature</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Upgrade to HireFlow Pro to submit proposals and apply to jobs.
                  </p>
                  <Link to="/upgrade">
                    <Button className="mt-4 w-full">Upgrade to Pro</Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {!user && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-slate-500">Log in to apply for this job.</p>
              <Link to="/login" className="mt-3 block">
                <Button className="w-full">Log in to apply</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

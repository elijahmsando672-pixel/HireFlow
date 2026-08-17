import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { api } from "../lib/api";
import type { Job, ProposalWithCandidate } from "../lib/types";
import { formatMoney, initials, timeAgo } from "../lib/format";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";

export default function JobProposals() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobId = parseInt(id || "0", 10);

  if (!id || isNaN(jobId) || jobId <= 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-500">Invalid job ID.</p>
        <Link to="/my-jobs" className="mt-4 inline-block font-semibold text-indigo-600">
          ← Back to my jobs
        </Link>
      </div>
    );
  }

  const [job, setJob] = useState<Job | null>(null);
  const [proposals, setProposals] = useState<ProposalWithCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hiring, setHiring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getJob(jobId), api.getJobProposals(jobId)])
      .then(([jobData, propData]) => {
        if (cancelled) return;
        setJob(jobData.job);
        setProposals(propData.proposals);
      })
      .catch((err) => !cancelled && setError((err as Error).message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const setStatus = async (proposalId: number, status: string) => {
    try {
      await api.updateProposal(proposalId, status);
      setProposals((prev) => prev.map((p) => (p.id === proposalId ? { ...p, status: status as ProposalWithCandidate["status"] } : p)));
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const hire = async (proposalId: number) => {
    if (!confirm("Hire this freelancer? This accepts their proposal and starts a contract with escrow payment.")) return;
    setHiring(true);
    try {
      const data = await api.createContract(proposalId);
      navigate("/contracts/" + data.contract.id);
    } catch (err) {
      alert((err as Error).message);
      setHiring(false);
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
        <Link to="/my-jobs" className="mt-4 inline-block font-semibold text-indigo-600">
          ← Back to my jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <Link to="/my-jobs" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> My jobs
      </Link>

      <PageHeader
        title="Proposals for this job"
        subtitle={`${job.title} — ${job.proposalCount || 0} proposal${(job.proposalCount || 0) === 1 ? "" : "s"} received`}
      />

      {proposals.length === 0 ? (
        <EmptyState icon={<X size={36} />} title="No proposals yet" subtitle="Share your job to attract freelancers." />
      ) : (
        <div className="space-y-5">
          {proposals.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white">
                    {initials(p.firstName, p.lastName)}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">
                      {p.firstName} {p.lastName}
                    </p>
                    {p.headline && <p className="text-sm text-slate-500">{p.headline}</p>}
                    <p className="text-xs text-slate-400">Sent {timeAgo(p.createdAt)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={p.status} />
                </div>
              </div>

              {p.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.skills.map((skill, i) => (
                    <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{p.coverLetter}</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Rate</p>
                    <p className="font-bold text-slate-900">{formatMoney(p.rate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Timeline</p>
                    <p className="font-bold text-slate-900">{p.timelineDays} days</p>
                  </div>
                </div>
                {p.status === "Pending" && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setStatus(p.id, "Rejected")}>
                      <X size={15} /> Reject
                    </Button>
                    <Button size="sm" onClick={() => hire(p.id)} disabled={hiring}>
                      <Check size={15} /> {hiring ? "Starting…" : "Hire & start contract"}
                    </Button>
                  </div>
                )}
                {p.status === "Accepted" && (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => navigate("/contracts")}>
                      View contract
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

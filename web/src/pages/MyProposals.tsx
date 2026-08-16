import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { api } from "../lib/api";
import type { Proposal } from "../lib/types";
import { formatMoney, timeAgo } from "../lib/format";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";

export default function MyProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .myProposals()
      .then((data) => !cancelled && setProposals(data.proposals))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="animate-fade-up">
      <PageHeader title="My proposals" subtitle="Track the proposals you've sent and their status." />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : proposals.length === 0 ? (
        <EmptyState
          icon={<FileText size={36} />}
          title="No proposals sent yet"
          subtitle="Browse jobs and send your first proposal."
          action={
            <Link to="/jobs">
              <span className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
                Browse jobs
              </span>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <Link
              key={p.id}
              to={"/jobs/" + p.jobId}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                  <p className="text-sm text-slate-500">
                    {p.company} · {p.location} · posted salary {formatMoney(p.salary)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Proposed <span className="font-semibold text-slate-900">{formatMoney(p.rate)}</span> ·{" "}
                    {p.timelineDays} days · sent {timeAgo(p.createdAt)}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

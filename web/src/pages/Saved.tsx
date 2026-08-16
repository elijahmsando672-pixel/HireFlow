import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { api } from "../lib/api";
import type { Gig, Job } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { JobCard } from "../components/JobCard";
import { GigCard } from "../components/GigCard";
import { EmptyState } from "../components/EmptyState";

type Tab = "jobs" | "gigs";

export default function Saved() {
  const [tab, setTab] = useState<Tab>("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.savedJobs(), api.savedGigs()])
      .then(([jobData, gigData]) => {
        if (cancelled) return;
        setJobs(jobData.jobs);
        setGigs(gigData.gigs);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Saved items" subtitle="Jobs and gigs you've bookmarked." />

      <div className="mb-6 inline-flex rounded-xl bg-slate-200/70 p-1">
        {(["jobs", "gigs"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t === "jobs" ? `Jobs (${jobs.length})` : `Gigs (${gigs.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : tab === "jobs" ? (
        jobs.length === 0 ? (
          <EmptyState icon={<Bookmark size={36} />} title="No saved jobs" subtitle="Tap the save button on a job to bookmark it here." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )
      ) : gigs.length === 0 ? (
        <EmptyState icon={<Bookmark size={36} />} title="No saved gigs" subtitle="Tap the save button on a gig to bookmark it here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {gigs.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      )}
    </div>
  );
}

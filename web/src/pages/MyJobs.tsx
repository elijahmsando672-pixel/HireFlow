import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, FileText } from "lucide-react";
import { api } from "../lib/api";
import type { Job } from "../lib/types";
import { formatSalary, timeAgo } from "../lib/format";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { CategoryBadge } from "../components/CategoryBadge";

export default function MyJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .myJobs()
      .then((data) => !cancelled && setJobs(data.jobs))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="My jobs"
        subtitle="Jobs you've posted and their proposals."
        actions={
          <Link to="/post-job">
            <Button>
              <Briefcase size={16} /> Post a job
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={36} />}
          title="No jobs posted yet"
          subtitle="Post your first job and start receiving proposals from freelancers."
          action={
            <Link to="/post-job">
              <Button>Post a job</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={job.category} />
                    <span className="text-xs text-slate-400">Posted {timeAgo(job.posted)}</span>
                  </div>
                  <h3 className="mt-2 text-base font-bold text-slate-900">{job.title}</h3>
                  <p className="text-sm text-slate-500">
                    {job.company} · {job.location} · {job.type} · {formatSalary(job.salary)}
                  </p>
                </div>
                <Link to={`/jobs/${job.id}/proposals`}>
                  <Button variant="secondary" size="sm">
                    <FileText size={15} />
                    {job.proposalCount || 0} proposals
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { Link } from "react-router-dom";
import type { Job } from "../lib/types";
import { formatSalary, timeAgo } from "../lib/format";
import { CategoryBadge } from "./CategoryBadge";

export function JobCard({ job }: { job: Job }) {
  const proposals = job.proposalCount || 0;

  return (
    <Link
      to={"/jobs/" + job.id}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700">{job.title}</h3>
        <CategoryBadge category={job.category} />
      </div>
      <p className="mt-1 text-sm font-semibold text-indigo-700">{job.company}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
        {[job.location, job.type, formatSalary(job.salary), "Posted " + timeAgo(job.posted), proposals + (proposals === 1 ? " proposal" : " proposals")].map((item, i) => (
          <span key={i} className="rounded-md bg-slate-100 px-2 py-1">
            {item}
          </span>
        ))}
      </div>
      {job.description && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{job.description}</p>}
    </Link>
  );
}

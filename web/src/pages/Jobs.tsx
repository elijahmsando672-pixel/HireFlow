import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../lib/api";
import type { Job } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { JobCard } from "../components/JobCard";
import { EmptyState } from "../components/EmptyState";
import { Field, Select, TextInput } from "../components/Field";

const CATEGORIES = ["All", "Software", "Design", "Data", "Marketing", "Product", "IT", "Writing", "Video", "Other"];
const TYPES = ["All", "Full-time", "Part-time", "Contract", "Internship", "Freelance"];
const LOCATIONS = ["All", "Nairobi", "Mombasa", "Nakuru", "Remote"];

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");
  const [location, setLocation] = useState("All");
  const [sort, setSort] = useState("newest");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const filters: Record<string, string> = {};
    if (debouncedSearch) filters.search = debouncedSearch;
    if (category !== "All") filters.category = category;
    if (type !== "All") filters.type = type;
    if (location !== "All") filters.location = location;
    if (sort === "salary") filters.sort = "salary";

    api
      .getJobs(filters)
      .then((data) => !cancelled && setJobs(data.jobs))
      .catch((err) => !cancelled && setError((err as Error).message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, category, type, location, sort]);

  const filtered = useMemo(() => jobs, [jobs]);

  return (
    <div className="animate-fade-up">
      <PageHeader title="Browse jobs" subtitle="Find your next freelance or full-time opportunity." />

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Field label="Search">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <TextInput placeholder="Title, company, keyword…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </Field>
          </div>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Location">
            <Select value={location} onChange={(e) => setLocation(e.target.value)}>
              {LOCATIONS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-2 lg:col-span-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {loading ? "Searching…" : `${filtered.length} job${filtered.length === 1 ? "" : "s"} found`}
              </span>
              <Select value={sort} onChange={(e) => setSort(e.target.value)} className="!w-auto">
                <option value="newest">Newest first</option>
                <option value="salary">Highest salary</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No jobs match your filters" subtitle="Try clearing a filter or searching for something else." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

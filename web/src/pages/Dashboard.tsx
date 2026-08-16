import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, FolderKanban, Handshake, Layers, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Contract, Gig, Job, Order, Proposal } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { GigCard } from "../components/GigCard";
import { StatusBadge } from "../components/StatusBadge";

export default function Dashboard() {
  const { user } = useAuth();
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [myProposals, setMyProposals] = useState<Proposal[]>([]);
  const [myGigs, setMyGigs] = useState<Gig[]>([]);
  const [orders, setOrders] = useState<{ buyer: Order[]; seller: Order[] }>({ buyer: [], seller: [] });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [latestGigs, setLatestGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.myJobs(),
      api.myProposals(),
      api.myGigs(),
      api.myOrders(),
      api.getContracts(),
      api.getJobs({}),
      api.getGigs({})
    ])
      .then(([jobs, proposals, gigs, myOrders, myContracts, allJobs, allGigs]) => {
        if (cancelled) return;
        setMyJobs(jobs.jobs);
        setMyProposals(proposals.proposals);
        setMyGigs(gigs.gigs);
        setOrders(myOrders);
        setContracts(myContracts.contracts);
        setLatestJobs(allJobs.jobs.slice(0, 3));
        setLatestGigs(allGigs.gigs.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const role = user.role || "both";
  const isClient = role === "client" || role === "both";
  const isFreelancer = role === "freelancer" || role === "both";

  const needsProfile = !user?.headline;

  const activeContracts = contracts.filter((c) => ["Active", "Paid", "Delivered"].includes(c.status)).length;

  const stats: { label: string; value: number; icon: typeof Briefcase; to: string; color: string }[] = [];
  if (isClient) {
    stats.push({ label: "Jobs posted", value: myJobs.length, icon: Briefcase, to: "/my-jobs", color: "bg-blue-50 text-blue-600" });
    stats.push({ label: "Active contracts", value: activeContracts, icon: Handshake, to: "/contracts", color: "bg-violet-50 text-violet-600" });
    stats.push({ label: "Orders buying", value: orders.buyer.length, icon: ShoppingBag, to: "/my-orders", color: "bg-emerald-50 text-emerald-600" });
    if (isFreelancer) stats.push({ label: "Gigs live", value: myGigs.length, icon: FolderKanban, to: "/my-gigs", color: "bg-amber-50 text-amber-600" });
  }
  if (isFreelancer) {
    if (isClient) {
      stats.push({ label: "Proposals sent", value: myProposals.length, icon: Layers, to: "/my-proposals", color: "bg-rose-50 text-rose-600" });
      stats.push({ label: "Orders selling", value: orders.seller.length, icon: ShoppingBag, to: "/my-orders", color: "bg-teal-50 text-teal-600" });
    } else {
      stats.push({ label: "Proposals sent", value: myProposals.length, icon: Layers, to: "/my-proposals", color: "bg-violet-50 text-violet-600" });
      stats.push({ label: "Gigs live", value: myGigs.length, icon: FolderKanban, to: "/my-gigs", color: "bg-amber-50 text-amber-600" });
      stats.push({ label: "Orders selling", value: orders.seller.length, icon: ShoppingBag, to: "/my-orders", color: "bg-emerald-50 text-emerald-600" });
      stats.push({ label: "Active contracts", value: activeContracts, icon: Handshake, to: "/contracts", color: "bg-blue-50 text-blue-600" });
    }
  }

  const recentProposals = myProposals.slice(0, 4);
  const recentContracts = contracts.slice(0, 4);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`Welcome back, ${user?.firstName || "there"}`}
        subtitle={
          user?.headline ||
          (isClient && !isFreelancer
            ? "Hire top freelancers and manage contracts from here."
            : "Complete your profile to attract more clients.")
        }
        actions={
          <>
            {isClient && (
              <Link to="/post-job">
                <Button variant="secondary">
                  <Briefcase size={16} /> Post a job
                </Button>
              </Link>
            )}
            {isFreelancer && (
              <Link to="/create-gig">
                <Button>
                  <FolderKanban size={16} /> Create a gig
                </Button>
              </Link>
            )}
          </>
        }
      />

      {needsProfile && isFreelancer && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-medium text-amber-800">
            Your profile is incomplete — add a headline and skills so clients find you.
          </p>
          <Link to="/add-bio">
            <Button variant="secondary" size="sm">
              Complete profile
            </Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.to}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Active contracts */}
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Active contracts</h2>
            <Link to="/contracts" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recentContracts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <p className="text-sm text-slate-500">No contracts yet.</p>
              <Link to="/jobs" className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Browse jobs →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentContracts.map((c) => (
                <Link
                  key={c.id}
                  to={"/contracts/" + c.id}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{c.title}</p>
                      <p className="text-xs text-slate-500">
                        {c.clientId === user.id ? "Hiring" : "Working with"}{" "}
                        {c.clientId === user.id ? c.freelancer.firstName : c.client.firstName}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent proposals */}
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent proposals</h2>
            <Link to="/my-proposals" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recentProposals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <p className="text-sm text-slate-500">You haven't sent any proposals yet.</p>
              <Link to="/jobs" className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Browse jobs →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProposals.map((p) => (
                <Link
                  key={p.id}
                  to={"/jobs/" + p.jobId}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.company}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Latest jobs */}
        <div className="lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Latest jobs</h2>
            <Link to="/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="space-y-3">
              {latestJobs.map((job) => (
                <Link
                  key={job.id}
                  to={"/jobs/" + job.id}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
                >
                  <p className="text-sm font-bold text-slate-900">{job.title}</p>
                  <p className="text-xs text-slate-500">{job.company} · {job.location}</p>
                </Link>
              ))}
              {latestJobs.length === 0 && <p className="text-sm text-slate-400">No jobs yet.</p>}
            </div>
          )}
        </div>
      </div>

      {/* Trending gigs */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Trending gigs</h2>
          <Link to="/gigs" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {latestGigs.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      </div>
    </div>
  );
}

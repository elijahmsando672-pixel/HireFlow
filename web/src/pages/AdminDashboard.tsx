import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Users, Briefcase, FileText, Handshake, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";
import type { AdminStats } from "../lib/types";
import { PageHeader } from "../components/PageHeader";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminGetStats()
      .then((data) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Admin Dashboard" subtitle="Platform overview and management" />

      {stats && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard icon={<Users size={20} />} label="Total Users" value={stats.totalUsers} color="indigo" />
            <StatCard icon={<Briefcase size={20} />} label="Jobs Posted" value={stats.totalJobs} color="blue" />
            <StatCard icon={<FileText size={20} />} label="Applications" value={stats.totalApplications} color="violet" />
            <StatCard icon={<Handshake size={20} />} label="Contracts" value={stats.totalContracts} color="emerald" />
            <StatCard icon={<Sparkles size={20} />} label="Gigs" value={stats.totalGigs} color="amber" />
            <StatCard icon={<ShieldCheck size={20} />} label="Verified Employers" value={stats.verifiedEmployers} color="emerald" />
            <StatCard
              icon={<AlertTriangle size={20} />}
              label="Pending Verifications"
              value={stats.pendingVerifications}
              color={stats.pendingVerifications > 0 ? "amber" : "slate"}
              highlight={stats.pendingVerifications > 0}
            />
            <StatCard icon={<Shield size={20} />} label="Suspended Users" value={stats.suspendedUsers} color="red" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Users by Role</h3>
              <div className="mt-4 space-y-3">
                {Object.entries(stats.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 capitalize">{role}</span>
                    <span className="font-bold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
              <div className="mt-4 space-y-2">
                <Link
                  to="/admin/verifications"
                  className="flex items-center justify-between rounded-xl bg-indigo-50 p-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={16} /> Review Verifications
                  </span>
                  {stats.pendingVerifications > 0 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                      {stats.pendingVerifications} pending
                    </span>
                  )}
                </Link>
                <Link
                  to="/jobs"
                  className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <Briefcase size={16} /> Browse Jobs
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, highlight }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-50 text-slate-500"
  };

  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${highlight ? "border-amber-300 ring-1 ring-amber-100" : "border-slate-200"}`}>
      <div className={`inline-flex rounded-lg p-2 ${colors[color] || colors.slate}`}>{icon}</div>
      <p className="mt-3 text-2xl font-black text-slate-900">{value.toLocaleString()}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

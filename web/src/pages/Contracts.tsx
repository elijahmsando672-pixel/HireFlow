import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Handshake, TrendingUp } from "lucide-react";
import { api } from "../lib/api";
import type { Contract } from "../lib/types";
import { formatMoney, timeAgo } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";

type Tab = "all" | "client" | "freelancer";

export default function Contracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getContracts()
      .then((data) => !cancelled && setContracts(data.contracts))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const filtered = contracts.filter((c) => {
    if (tab === "client") return c.clientId === user.id;
    if (tab === "freelancer") return c.freelancerId === user.id;
    return true;
  });

  const counts = {
    client: contracts.filter((c) => c.clientId === user.id).length,
    freelancer: contracts.filter((c) => c.freelancerId === user.id).length
  };

  const activeCount = contracts.filter((c) => ["Active", "Paid", "Delivered"].includes(c.status)).length;

  const tabs: { value: Tab; label: string }[] = [
    { value: "all", label: `All (${contracts.length})` },
    { value: "client", label: `Hiring (${counts.client})` },
    { value: "freelancer", label: `Working (${counts.freelancer})` }
  ];

  const renderContract = (contract: Contract) => {
    const isClient = contract.clientId === user.id;
    const counterpart = isClient ? contract.freelancer : contract.client;

    return (
      <Link
        key={contract.id}
        to={`/contracts/${contract.id}`}
        className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-slate-900">{contract.title}</p>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                  contract.type === "gig" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"
                }`}
              >
                {contract.type === "gig" ? "Gig order" : "Job hire"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {isClient ? "Hiring" : "Working with"} {counterpart.firstName} {counterpart.lastName}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">Created {timeAgo(contract.createdAt)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={contract.status} />
            <p className="font-black text-slate-900">{formatMoney(contract.amount)}</p>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Contracts"
        subtitle={`${activeCount} active — money is in escrow until you deliver and the client accepts.`}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-slate-200/70 p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === t.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Handshake size={36} />}
          title="No contracts yet"
          subtitle="Hire a freelancer from a proposal, or place a gig order, and your contract will appear here."
          action={
            <button
              onClick={() => (window.location.href = "/jobs")}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <TrendingUp size={16} /> Browse jobs
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">{filtered.map(renderContract)}</div>
      )}
    </div>
  );
}

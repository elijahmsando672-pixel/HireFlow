const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Accepted: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-700",
  "In Progress": "bg-blue-100 text-blue-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-slate-200 text-slate-600",
  Active: "bg-blue-100 text-blue-800",
  Paid: "bg-violet-100 text-violet-800",
  Delivered: "bg-amber-100 text-amber-800",
  Released: "bg-emerald-100 text-emerald-800"
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
}

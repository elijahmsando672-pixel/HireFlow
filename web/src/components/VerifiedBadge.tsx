import { ShieldCheck } from "lucide-react";

export function VerifiedBadge({ size = "sm", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "text-xs gap-1 px-2 py-0.5",
    md: "text-sm gap-1.5 px-2.5 py-1",
    lg: "text-base gap-2 px-3 py-1.5"
  };

  const iconSizes = { sm: 12, md: 14, lg: 16 };

  return (
    <span
      className={`inline-flex items-center rounded-full bg-emerald-50 font-semibold text-emerald-700 ring-1 ring-emerald-200 ${sizeClasses[size]} ${className}`}
    >
      <ShieldCheck size={iconSizes[size]} className="text-emerald-600" />
      Verified Employer
    </span>
  );
}

export function VerificationStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-red-50 text-red-700 ring-red-200"
  };

  const labels: Record<string, string> = {
    pending: "Under Review",
    approved: "Verified",
    rejected: "Rejected"
  };

  const color = styles[status] || "bg-slate-50 text-slate-600 ring-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${color}`}>
      {labels[status] || status}
    </span>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Software: "bg-blue-100 text-blue-800",
  Design: "bg-violet-100 text-violet-800",
  Data: "bg-emerald-100 text-emerald-800",
  Marketing: "bg-pink-100 text-pink-800",
  Product: "bg-amber-100 text-amber-800",
  IT: "bg-slate-200 text-slate-700",
  Writing: "bg-cyan-100 text-cyan-800",
  Video: "bg-orange-100 text-orange-800",
  Other: "bg-slate-100 text-slate-600"
};

export function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {category}
    </span>
  );
}

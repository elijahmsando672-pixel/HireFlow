import { getCategoryIdFromSubcategory } from "../lib/categories";

const CATEGORY_COLORS: Record<string, string> = {
  "development-it": "bg-blue-100 text-blue-800",
  "design-creative": "bg-violet-100 text-violet-800",
  "writing-languages": "bg-cyan-100 text-cyan-800",
  "marketing-sales": "bg-pink-100 text-pink-800",
  "business": "bg-amber-100 text-amber-800",
  "admin-support": "bg-slate-200 text-slate-700",
  "engineering-professional": "bg-emerald-100 text-emerald-800"
};

export function CategoryBadge({ category }: { category: string }) {
  const categoryId = getCategoryIdFromSubcategory(category);
  const color = categoryId ? CATEGORY_COLORS[categoryId] : "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {category}
    </span>
  );
}

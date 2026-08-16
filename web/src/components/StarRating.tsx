import { Star } from "lucide-react";

export function StarRating({ rating, count, size = 14 }: { rating: number | null; count?: number; size?: number }) {
  if (!rating) {
    return <span className="text-sm text-slate-400">No reviews yet</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} fill={i <= Math.round(rating) ? "currentColor" : "none"} strokeWidth={1.5} />
        ))}
      </span>
      <span className="text-sm font-semibold text-slate-700">{rating}</span>
      {count !== undefined && <span className="text-sm text-slate-400">({count})</span>}
    </span>
  );
}

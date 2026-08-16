import { Link } from "react-router-dom";
import type { Gig } from "../lib/types";
import { formatMoney, initials } from "../lib/format";
import { CategoryBadge } from "./CategoryBadge";
import { StarRating } from "./StarRating";

export function GigCard({ gig }: { gig: Gig }) {
  const startingPrice = gig.packages.length ? gig.packages[0].price : 0;

  return (
    <Link
      to={"/gigs/" + gig.id}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <CategoryBadge category={gig.category} />
        <span className="text-xs text-slate-400">{gig.orderCount || 0} orders</span>
      </div>
      <h3 className="mt-3 line-clamp-2 text-base font-bold text-slate-900 group-hover:text-indigo-700">
        {gig.title}
      </h3>
      <div className="mt-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
          {initials(gig.seller.firstName, gig.seller.lastName)}
        </span>
        <span className="text-sm font-medium text-slate-600">{gig.seller.firstName}</span>
      </div>
      <div className="mt-2">
        <StarRating rating={gig.rating} count={gig.reviewCount} size={12} />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">Starting at</span>
        <span className="text-lg font-bold text-indigo-700">{formatMoney(startingPrice)}</span>
      </div>
    </Link>
  );
}

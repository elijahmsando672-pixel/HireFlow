import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Clock, MessageSquare, ShoppingBag } from "lucide-react";
import { api } from "../lib/api";
import type { Gig, Review } from "../lib/types";
import { formatMoney, initials, timeAgo } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { CategoryBadge } from "../components/CategoryBadge";
import { StarRating } from "../components/StarRating";
import { SaveButton } from "../components/SaveButton";
import { Button } from "../components/Button";

export default function GigDetails() {
  const { id } = useParams();
  const gigId = parseInt(id || "0", 10);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [gig, setGig] = useState<Gig | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .getGig(gigId)
      .then((data) => {
        if (cancelled) return;
        setGig(data.gig);
        setReviews(data.reviews);
      })
      .catch((err) => !cancelled && setError((err as Error).message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [gigId]);

  const isOwner = user && gig?.userId === user.id;

  const handleOrder = async () => {
    if (!gig) return;
    setOrderError("");
    setOrdering(true);
    try {
      await api.createOrder({ gigId: gig.id, packageName: gig.packages[selected].name });
      navigate("/my-orders?placed=1");
    } catch (err) {
      setOrderError((err as Error).message);
      setOrdering(false);
    }
  };

  const messageSeller = () => {
    if (gig) navigate("/messages?user=" + gig.userId);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-500">{error || "Gig not found."}</p>
        <Link to="/gigs" className="mt-4 inline-block font-semibold text-indigo-600 hover:text-indigo-700">
          ← Back to gigs
        </Link>
      </div>
    );
  }

  const pkg = gig.packages[selected];

  return (
    <div className="animate-fade-up">
      <Link to="/gigs" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to gigs
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CategoryBadge category={gig.category} />
                <span className="text-xs text-slate-400">{gig.orderCount || 0} orders completed</span>
              </div>
              {user && !isOwner && <SaveButton type="gig" id={gig.id} />}
            </div>

            <h1 className="mt-4 text-2xl font-black text-slate-900 sm:text-3xl">{gig.title}</h1>

            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white">
                {initials(gig.seller.firstName, gig.seller.lastName)}
              </span>
              <div>
                <p className="font-bold text-slate-900">
                  {gig.seller.firstName} {gig.seller.lastName}
                </p>
                {gig.seller.headline && <p className="text-sm text-slate-500">{gig.seller.headline}</p>}
              </div>
              <span className="ml-auto">
                <StarRating rating={gig.rating} count={gig.reviewCount} />
              </span>
            </div>

            <hr className="my-6 border-slate-100" />

            <h2 className="text-lg font-bold text-slate-900">About this gig</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{gig.description}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {!isOwner && user && (
                <Button variant="secondary" onClick={messageSeller}>
                  <MessageSquare size={16} /> Message seller
                </Button>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No reviews yet — be the first to buy this gig and leave one.</p>
            ) : (
              <div className="mt-5 space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                          {initials(review.firstName, review.lastName)}
                        </span>
                        <p className="text-sm font-bold text-slate-900">
                          {review.firstName} {review.lastName}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">{timeAgo(review.createdAt)}</span>
                    </div>
                    <div className="mt-2">
                      <StarRating rating={review.rating} size={13} />
                    </div>
                    {review.comment && <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order sidebar */}
        <div>
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">Choose a package</h3>

            <div className="mt-4 space-y-3">
              {gig.packages.map((pkgItem, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selected === i ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{pkgItem.name}</span>
                    <span className="font-black text-indigo-700">{formatMoney(pkgItem.price)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-500">{pkgItem.description}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Clock size={13} /> {pkgItem.deliveryDays} day delivery
                  </p>
                </button>
              ))}
            </div>

            {orderError && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{orderError}</div>}

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">
                {pkg.name} · {pkg.deliveryDays} days
              </span>
              <span className="text-xl font-black text-slate-900">{formatMoney(pkg.price)}</span>
            </div>

            {isOwner ? (
              <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">This is your gig.</p>
            ) : user ? (
              <Button className="mt-4 w-full" size="lg" onClick={handleOrder} disabled={ordering}>
                <ShoppingBag size={18} /> {ordering ? "Placing order…" : "Continue to order"}
              </Button>
            ) : (
              <Link to="/login" className="mt-4 block">
                <Button className="w-full" size="lg">
                  <ShoppingBag size={18} /> Log in to order
                </Button>
              </Link>
            )}

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Check size={13} className="text-emerald-500" /> Secure order — communicate via HireFlow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

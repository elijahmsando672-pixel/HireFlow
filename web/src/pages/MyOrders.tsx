import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Handshake, ShoppingBag } from "lucide-react";
import { api } from "../lib/api";
import type { Order } from "../lib/types";
import { formatMoney, timeAgo } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";

type Tab = "buyer" | "seller";

export default function MyOrders() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<Tab>(params.get("placed") ? "buyer" : "seller");
  const [buyer, setBuyer] = useState<Order[]>([]);
  const [seller, setSeller] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Review dialog state
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .myOrders()
      .then((data) => {
        if (cancelled) return;
        setBuyer(data.buyer);
        setSeller(data.seller);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, []);

  const openReview = (order: Order) => {
    setReviewOrder(order);
    setRating(5);
    setComment("");
    setReviewError("");
  };

  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewOrder) return;
    setReviewBusy(true);
    setReviewError("");
    try {
      await api.createReview({ orderId: reviewOrder.id, rating, comment });
      setReviewOrder(null);
      setBuyer((prev) => prev.map((o) => (o.id === reviewOrder.id ? { ...o, reviewed: true } : o)));
      setSeller((prev) => prev.map((o) => (o.id === reviewOrder.id ? { ...o, reviewed: true } : o)));
    } catch (err) {
      setReviewError((err as Error).message);
    } finally {
      setReviewBusy(false);
    }
  };

  const orders = tab === "buyer" ? buyer : seller;
  const isSellerView = tab === "seller";

  const renderOrder = (order: Order) => {
    const counterpart = isSellerView ? order.buyer : order.seller;
    const canReview = order.status === "Completed" && !order.reviewed && (user ? order.buyer.id === user.id : false);

    return (
      <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-bold text-slate-900">{order.gigTitle}</p>
            <p className="text-sm text-slate-500">
              {order.packageName} package · {formatMoney(order.price)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {isSellerView ? "Buyer" : "Seller"}: {counterpart.firstName} {counterpart.lastName} · ordered {timeAgo(order.orderedAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={order.status} />
            {order.completedAt && <span className="text-xs text-slate-400">Completed {timeAgo(order.completedAt)}</span>}
            {order.contractId && (
              <Link
                to={"/contracts/" + order.contractId}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Handshake size={13} /> View contract
              </Link>
            )}
          </div>
        </div>

        {canReview && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" size="sm" onClick={() => openReview(order)}>
              Leave a review
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="My orders" subtitle="Buy and sell activity." />

      {/* Tabs */}
      <div className="mb-6 inline-flex rounded-xl bg-slate-200/70 p-1">
        {(["buyer", "seller"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {t === "buyer" ? `Buying (${buyer.length})` : `Selling (${seller.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={36} />}
          title={isSellerView ? "No orders selling yet" : "No orders yet"}
          subtitle={isSellerView ? "Create a gig and buyers will start ordering." : "Browse gigs and place your first order."}
          action={
            isSellerView ? (
              <Button onClick={() => (window.location.href = "/create-gig")}>Create a gig</Button>
            ) : (
              <Button onClick={() => (window.location.href = "/gigs")}>Browse gigs</Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">{orders.map(renderOrder)}</div>
      )}

      {/* Review dialog */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setReviewOrder(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900">Review this order</h3>
            <p className="mt-1 text-sm text-slate-500">{reviewOrder.gigTitle}</p>

            <form onSubmit={submitReview} className="mt-5 space-y-4">
              {reviewError && <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{reviewError}</div>}

              <div>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Rating</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className={`text-2xl transition ${n <= rating ? "text-amber-400" : "text-slate-300 hover:text-amber-300"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Comment</label>
                <textarea
                  rows={4}
                  className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="How was the experience?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setReviewOrder(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={reviewBusy}>
                  {reviewBusy ? "Submitting…" : "Submit review"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

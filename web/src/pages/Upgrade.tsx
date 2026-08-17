import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { PageHeader } from "../components/PageHeader";

export default function Upgrade() {
  const { user, subscriptionStatus, refreshSubscription } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const status = url.searchParams.get("status");

    if (status === "SUCCESS" || status === "COMPLETED") {
      setMessage("Payment successful! Your Pro subscription is being activated.");
      refreshSubscription();
    } else if (status && status !== "null") {
      setError("Payment was not completed. Please try again.");
    }
  }, [refreshSubscription]);

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await api.subscriptionCheckout();
      const data = result.data;

      if (data.alreadyActive) {
        setMessage("You already have an active Pro subscription.");
        return;
      }

      if (data.mock) {
        setMessage("Mock payment activated! Your Pro subscription is now active.");
        refreshSubscription();
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError((err as Error).message || "Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isPro = subscriptionStatus?.plan === "PRO" && subscriptionStatus?.isActive;

  return (
    <div className="animate-fade-up">
      <PageHeader title="Upgrade to Pro" subtitle="Unlock proposals, applications and more." />

      <div className="mx-auto max-w-3xl">
        {isPro ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-4 text-2xl font-black text-emerald-900">You are on Pro</h2>
            <p className="mt-2 text-emerald-700">
              Expires: {subscriptionStatus?.expiresAt ? new Date(subscriptionStatus.expiresAt).toLocaleDateString() : "N/A"}
            </p>
            <Button className="mt-6" onClick={() => navigate("/jobs")}>Browse jobs</Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Free</h3>
              <p className="mt-1 text-sm text-slate-500">Browse and discover</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 text-emerald-500" /> Browse jobs</li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 text-emerald-500" /> View job details</li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 text-emerald-500" /> Search and filter jobs</li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 text-emerald-500" /> View aggregated job listings</li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 text-emerald-500" /> View public freelancer profiles</li>
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-indigo-600 bg-indigo-50 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-indigo-900">Pro</h3>
                  <p className="mt-1 text-sm text-indigo-700">Apply and win work</p>
                </div>
                <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">Popular</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-indigo-800">
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 text-indigo-600" /> Submit proposals</li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 text-indigo-600" /> Apply to jobs</li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 text-indigo-600" /> Premium marketplace features</li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 text-indigo-600" /> Premium aggregated-job access</li>
              </ul>
              <div className="mt-6">
                <p className="text-3xl font-black text-indigo-900">KES 500<span className="text-base font-semibold text-indigo-600">/mo</span></p>
                <Button className="mt-4 w-full" onClick={handleUpgrade} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade to Pro"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {message && <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div>}
        {error && <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      </div>
    </div>
  );
}

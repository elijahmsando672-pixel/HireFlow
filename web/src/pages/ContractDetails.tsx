import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  FileText,
  Handshake,
  Landmark,
  MessageSquare,
  PackageCheck,
  ShieldCheck,
  Star,
  X
} from "lucide-react";
import { api } from "../lib/api";
import type { Contract } from "../lib/types";
import { formatMoney, initials, timeAgo } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { StatusBadge } from "../components/StatusBadge";

const STEPS = [
  { key: "hire", label: "Hire", icon: Handshake },
  { key: "contract", label: "Contract", icon: FileText },
  { key: "payment", label: "Payment", icon: Landmark },
  { key: "delivery", label: "Delivery", icon: PackageCheck },
  { key: "review", label: "Review", icon: Star }
];

const PAYMENT_METHODS = ["M-Pesa", "Card", "Bank"];

export default function ContractDetails() {
  const { id } = useParams();
  const contractId = parseInt(id || "0", 10);
  const { user } = useAuth();

  if (!id || isNaN(contractId) || contractId <= 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-500">Invalid contract ID.</p>
        <Link to="/contracts" className="mt-4 inline-block font-semibold text-indigo-600">
          ← Back to contracts
        </Link>
      </div>
    );
  }

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPay, setShowPay] = useState(false);
  const [payMethod, setPayMethod] = useState("M-Pesa");
  const [payRef, setPayRef] = useState("");
  const [busy, setBusy] = useState(false);

  const [showDeliver, setShowDeliver] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .getContract(contractId)
      .then((data) => !cancelled && setContract(data.contract))
      .catch((err) => !cancelled && setError((err as Error).message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [contractId]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-500">{error || "Contract not found."}</p>
        <Link to="/contracts" className="mt-4 inline-block font-semibold text-indigo-600">
          ← Back to contracts
        </Link>
      </div>
    );
  }

  const isClient = contract.clientId === user.id;
  const isFreelancer = contract.freelancerId === user.id;
  const counterpart = isClient ? contract.freelancer : contract.client;
  const status = contract.status;

  const canPay = isClient && status === "Active" && !contract.payment;
  const canDeliver = isFreelancer && status === "Paid";
  const canComplete = isClient && status === "Delivered";
  const canCancel = isClient
    ? ["Active", "Paid", "Delivered"].includes(status)
    : ["Active", "Delivered"].includes(status);
  const completedStep = (key: string) => {
    if (key === "hire" || key === "contract") return true;
    if (key === "payment") return ["Paid", "Delivered", "Completed"].includes(status);
    if (key === "delivery") return ["Delivered", "Completed"].includes(status);
    return status === "Completed";
  };

  const pay = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api.payContract(contractId, payMethod, payRef);
      setContract(data.contract);
      setShowPay(false);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const deliver = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api.deliverContract(contractId, deliveryNote);
      setContract(data.contract);
      setShowDeliver(false);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    if (!confirm("Accept this delivery and complete the contract? Payment will be released to the freelancer.")) return;
    setBusy(true);
    try {
      const data = await api.completeContract(contractId);
      setContract(data.contract);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!confirm("Cancel this contract? The proposal/order will be closed too.")) return;
    setBusy(true);
    try {
      const data = await api.cancelContract(contractId);
      setContract(data.contract);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <Link to="/contracts" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Contracts
      </Link>

      <PageHeader
        title={contract.title}
        subtitle={
          <>
            {isClient ? "You are the client" : "You are the freelancer"} · working with {counterpart.firstName}{" "}
            {counterpart.lastName} · started {timeAgo(contract.createdAt)}
          </>
        }
        actions={<StatusBadge status={status} />}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Progress</h2>
            <div className="mt-6 flex items-start">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const done = completedStep(step.key);
                const isLast = index === STEPS.length - 1;
                return (
                  <div key={step.key} className="flex flex-1 items-start">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          done ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Icon size={18} />
                      </span>
                      <span className={`mt-2 text-xs font-semibold ${done ? "text-slate-900" : "text-slate-400"}`}>
                        {step.label}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={`mx-1 mt-5 h-0.5 flex-1 rounded ${done ? "bg-indigo-500" : "bg-slate-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            {(canPay || canDeliver || canComplete || canCancel) && (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-6">
                {canPay && (
                  <Button onClick={() => setShowPay(true)}>
                    <Landmark size={16} /> Pay {formatMoney(contract.amount)}
                  </Button>
                )}
                {canDeliver && (
                  <Button onClick={() => setShowDeliver(true)}>
                    <PackageCheck size={16} /> Deliver work
                  </Button>
                )}
                {canComplete && (
                  <Button onClick={complete} disabled={busy}>
                    <CheckCircle2 size={16} /> Accept & complete
                  </Button>
                )}
                {canCancel && (
                  <Button variant="danger" onClick={cancel} disabled={busy}>
                    Cancel contract
                  </Button>
                )}
              </div>
            )}

            {status === "Completed" && contract.orderId && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                <p className="flex items-center gap-2 text-sm font-medium text-amber-800">
                  <Star size={16} className="fill-amber-500 text-amber-500" />
                  Order complete — leave a review for the freelancer.
                </p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => (window.location.href = "/my-orders")}>
                  Review the order
                </Button>
              </div>
            )}

            {status === "Completed" && !contract.orderId && (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                  <ShieldCheck size={16} />
                  Contract completed — payment released to the freelancer.
                </p>
              </div>
            )}
          </div>

          {/* Delivery note */}
          {contract.deliveryNote && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Delivery</h3>
              <p className="mt-1 text-xs text-slate-400">
                Delivered {contract.deliveredAt ? timeAgo(contract.deliveredAt) : ""}
              </p>
              <div className="mt-3 rounded-xl bg-slate-50 p-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{contract.deliveryNote}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Party card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-sm font-black text-white">
                {initials(counterpart.firstName, counterpart.lastName)}
              </span>
              <div>
                <p className="font-bold text-slate-900">
                  {counterpart.firstName} {counterpart.lastName}
                </p>
                <p className="text-sm text-slate-500">{isClient ? "Freelancer" : "Client"}</p>
              </div>
            </div>
            <Link
              to={"/users/" + counterpart.id}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View profile
            </Link>
            <Link
              to={"/messages?user=" + counterpart.id}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <MessageSquare size={16} /> Message
            </Link>
          </div>

          {/* Money card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Banknote size={16} className="text-slate-400" /> Payment
            </h3>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-sm text-slate-500">Agreed amount</span>
              <span className="text-xl font-black text-slate-900">{formatMoney(contract.amount)}</span>
            </div>
            {contract.payment ? (
              <div className="mt-4 space-y-2 rounded-xl bg-emerald-50 p-4 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-emerald-800">Paid via</span>
                  <span className="font-semibold text-emerald-900">{contract.payment.method}</span>
                </p>
                {contract.payment.reference && (
                  <p className="flex items-center justify-between">
                    <span className="text-emerald-800">Reference</span>
                    <span className="font-semibold text-emerald-900">{contract.payment.reference}</span>
                  </p>
                )}
                <p className="flex items-center justify-between">
                  <span className="text-emerald-800">Status</span>
                  <StatusBadge status={contract.payment.status} />
                </p>
                <p className="text-xs text-emerald-700">
                  Paid {contract.payment.paidAt ? timeAgo(contract.payment.paidAt) : ""} · held in escrow
                </p>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                {isClient ? "Awaiting payment from you." : "Awaiting payment from the client."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment modal */}
      {showPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setShowPay(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Pay for contract</h3>
              <button onClick={() => setShowPay(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {contract.title} — {formatMoney(contract.amount)}. Funds are held in escrow until you accept the delivery.
            </p>

            <form onSubmit={pay} className="mt-5 space-y-4">
              <div>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Payment method</span>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayMethod(method)}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                        payMethod === method
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-300 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Transaction reference (optional)</label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g. MPESAXX12ABC"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowPay(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "Processing…" : `Pay ${formatMoney(contract.amount)}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery modal */}
      {showDeliver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setShowDeliver(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Deliver work</h3>
              <button onClick={() => setShowDeliver(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Send your completed work for {contract.title}. The client can accept it or ask for changes.
            </p>

            <form onSubmit={deliver} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Delivery note</label>
                <textarea
                  rows={4}
                  required
                  className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Share a link to the work, files, or a short summary…"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowDeliver(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? "Sending…" : "Deliver"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

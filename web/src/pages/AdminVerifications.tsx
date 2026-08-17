import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, ShieldCheck, ShieldX, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../lib/api";
import type { AdminVerification } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Field, TextArea } from "../components/Field";
import { VerificationStatus } from "../components/VerifiedBadge";

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState<AdminVerification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminVerification | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 10;

  const fetchVerifications = () => {
    setLoading(true);
    api
      .adminGetVerifications({ status: statusFilter || undefined, page, limit })
      .then((data) => {
        setVerifications(data.verifications);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVerifications();
  }, [page, statusFilter]);

  const handleApprove = async (id: number) => {
    if (!confirm("Approve this employer? They will receive a Verified badge.")) return;
    setActionLoading(true);
    try {
      await api.adminApproveVerification(id);
      setSelected(null);
      fetchVerifications();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Reject this verification request?")) return;
    setActionLoading(true);
    try {
      await api.adminRejectVerification(id, rejectNotes || undefined);
      setSelected(null);
      setRejectNotes("");
      fetchVerifications();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-fade-up">
      <Link to="/admin" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <Shield size={16} /> Admin Dashboard
      </Link>

      <PageHeader
        title="Employer Verifications"
        subtitle={`${total} total verification request${total === 1 ? "" : "s"}`}
        actions={
          <div className="flex gap-2">
            {["", "pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === s
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : verifications.length === 0 ? (
        <div className="py-16 text-center text-slate-500">No verification requests found.</div>
      ) : (
        <div className="space-y-3">
          {verifications.map((v) => (
            <div
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{v.companyName}</p>
                  <p className="text-sm text-slate-500">
                    {v.firstName} {v.lastName} ({v.userEmail})
                  </p>
                  <p className="text-xs text-slate-400">
                    {v.companyCountry} · Submitted {new Date(v.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <VerificationStatus status={v.status} />
                <Button variant="outline" size="sm" onClick={() => setSelected(v)}>
                  Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Review Verification</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="font-semibold text-slate-700">Company:</span>{" "}
                <span className="text-slate-900">{selected.companyName}</span>
              </div>
              {selected.companyWebsite && (
                <div>
                  <span className="font-semibold text-slate-700">Website:</span>{" "}
                  <a href={selected.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    {selected.companyWebsite} <ExternalLink size={12} className="inline" />
                  </a>
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-700">Email:</span>{" "}
                <span className="text-slate-900">{selected.companyEmail}</span>
              </div>
              {selected.companyPhone && (
                <div>
                  <span className="font-semibold text-slate-700">Phone:</span>{" "}
                  <span className="text-slate-900">{selected.companyPhone}</span>
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-700">Country:</span>{" "}
                <span className="text-slate-900">{selected.companyCountry}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Description:</span>
                <p className="mt-1 whitespace-pre-line text-slate-600">{selected.companyDescription}</p>
              </div>
              {selected.businessInfo && (
                <div>
                  <span className="font-semibold text-slate-700">Additional Info:</span>
                  <p className="mt-1 whitespace-pre-line text-slate-600">{selected.businessInfo}</p>
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-700">Submitted by:</span>{" "}
                <span className="text-slate-900">{selected.firstName} {selected.lastName} ({selected.userEmail})</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Submitted:</span>{" "}
                <span className="text-slate-900">{new Date(selected.submittedAt).toLocaleString()}</span>
              </div>
              {selected.adminNotes && (
                <div className="rounded-lg bg-red-50 p-3">
                  <span className="font-semibold text-red-700">Previous rejection reason:</span>{" "}
                  <span className="text-red-600">{selected.adminNotes}</span>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {selected.status !== "approved" && (
                <>
                  <Field label="Rejection notes (optional)">
                    <TextArea
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      placeholder="Reason for rejection..."
                      rows={2}
                    />
                  </Field>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleReject(selected.id)}
                      variant="outline"
                      disabled={actionLoading}
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <ShieldX size={16} /> Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(selected.id)}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      <ShieldCheck size={16} /> {actionLoading ? "Processing..." : "Approve & Verify"}
                    </Button>
                  </div>
                </>
              )}
              {selected.status === "approved" && (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  This employer is already verified.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Verification } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Field, TextInput, Select, TextArea } from "../components/Field";
import { VerificationStatus } from "../components/VerifiedBadge";

const COUNTRIES = [
  "Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia", "Nigeria", "Ghana",
  "South Africa", "Egypt", "Morocco", "Other"
];

export default function Verify() {
  const { user } = useAuth();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyEmail, setCompanyEmail] = useState(user?.email || "");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyCountry, setCompanyCountry] = useState("Kenya");
  const [companyDescription, setCompanyDescription] = useState("");
  const [businessInfo, setBusinessInfo] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .getVerificationStatus()
      .then((data) => !cancelled && setVerification(data.verification))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data = await api.submitVerification({
        companyName,
        companyWebsite: companyWebsite || undefined,
        companyEmail,
        companyPhone: companyPhone || undefined,
        companyCountry,
        companyDescription,
        businessInfo: businessInfo || undefined
      });
      setVerification(data.verification);
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (user?.isVerified) {
    return (
      <div className="animate-fade-up">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <ShieldCheck size={48} className="mx-auto text-emerald-600" />
          <h2 className="mt-4 text-xl font-bold text-emerald-900">Your account is verified</h2>
          <p className="mt-2 text-emerald-700">
            Your employer account has been verified. Your jobs and profile will display the Verified Employer badge.
          </p>
          <Link to="/dashboard" className="mt-6 inline-block">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (verification && verification.status === "pending") {
    return (
      <div className="animate-fade-up">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <ShieldCheck size={48} className="mx-auto text-amber-500" />
          <h2 className="mt-4 text-xl font-bold text-amber-900">Verification under review</h2>
          <p className="mt-2 text-amber-700">
            Your verification request submitted on {new Date(verification.submittedAt).toLocaleDateString()} is being reviewed by our team. We'll notify you once a decision is made.
          </p>
          <div className="mt-4">
            <VerificationStatus status={verification.status} />
          </div>
          <Link to="/dashboard" className="mt-6 inline-block">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (verification && verification.status === "rejected") {
    return (
      <div className="animate-fade-up">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <ShieldCheck size={48} className="mx-auto text-red-400" />
          <h2 className="mt-4 text-xl font-bold text-red-900">Verification was not approved</h2>
          {verification.adminNotes && (
            <p className="mt-2 text-red-700">Reason: {verification.adminNotes}</p>
          )}
          <p className="mt-2 text-red-600">Please update your information and submit again.</p>
          <div className="mt-4">
            <VerificationStatus status={verification.status} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Dashboard
      </Link>

      <PageHeader
        title="Employer Verification"
        subtitle="Verify your employer account to build trust with job seekers. Verified employers receive a badge on their profile and job listings."
      />

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 rounded-xl bg-indigo-50 p-4">
            <h3 className="text-sm font-bold text-indigo-900">Why verify?</h3>
            <ul className="mt-2 space-y-1 text-sm text-indigo-700">
              <li>• Display a "Verified Employer" badge on your profile and jobs</li>
              <li>• Build trust with job seekers</li>
              <li>• Get higher visibility in search results</li>
            </ul>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {success && (
            <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              Verification request submitted! Our team will review it shortly.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Company Name">
              <TextInput
                value={companyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
                placeholder="e.g., Acme Technologies Ltd"
                required
                minLength={2}
              />
            </Field>

            <Field label="Company Website">
              <TextInput
                value={companyWebsite}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyWebsite(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </Field>

            <Field label="Company Email">
              <TextInput
                value={companyEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyEmail(e.target.value)}
                placeholder="hr@company.com"
                type="email"
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <TextInput
                  value={companyPhone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyPhone(e.target.value)}
                  placeholder="+254 700 000000"
                />
              </Field>

              <Field label="Country">
                <Select
                  value={companyCountry}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCompanyCountry(e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Company Description" hint="Tell us what your company does (minimum 20 characters)">
              <TextArea
                value={companyDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompanyDescription(e.target.value)}
                placeholder="Describe your company, its mission, and what it does..."
                rows={4}
                required
                minLength={20}
              />
            </Field>

            <Field label="Additional Business Information" hint="Optional: Registration number, tax ID, or other details">
              <TextArea
                value={businessInfo}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBusinessInfo(e.target.value)}
                placeholder="Any additional information that helps verify your business..."
                rows={3}
              />
            </Field>

            <div className="pt-2">
              <Button type="submit" disabled={submitting || success} className="w-full">
                {submitting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
            By submitting, you confirm that the information provided is accurate. False information may result in account suspension.
          </div>
        </div>
      </div>
    </div>
  );
}

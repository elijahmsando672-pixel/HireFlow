import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Field, Select, TextArea, TextInput } from "../components/Field";
import { CATEGORIES, getSubcategoriesByCategoryId } from "../lib/categories";

const TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];

export default function PostJob() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("Remote");
  const [type, setType] = useState("Contract");
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [subcategory, setSubcategory] = useState("");
  const [salary, setSalary] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const availableSubcategories = useMemo(() => {
    return getSubcategoriesByCategoryId(categoryId);
  }, [categoryId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.postJob({
        title,
        company,
        location,
        type,
        category: subcategory || categoryId,
        salary: parseInt(salary, 10),
        description,
        requirements: requirements
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      });
      navigate("/my-jobs");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <PageHeader title="Post a job" subtitle="Tell freelancers what you need and start receiving proposals." />

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Job title">
            <TextInput required placeholder="e.g. Frontend Developer" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Company / client">
            <TextInput required placeholder="e.g. Savanna Labs" value={company} onChange={(e) => setCompany(e.target.value)} />
          </Field>
          <Field label="Location">
            <TextInput placeholder="e.g. Nairobi, Remote" value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Job type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </Field>
          {availableSubcategories.length > 0 && (
            <Field label="Subcategory">
              <Select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>
                <option value="">Select subcategory</option>
                {availableSubcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Salary (KSh)">
            <TextInput type="number" min={0} placeholder="e.g. 120000" value={salary} onChange={(e) => setSalary(e.target.value)} />
          </Field>
        </div>

        <Field label="Description" hint="Describe the role, the project and what success looks like.">
          <TextArea rows={6} required placeholder="We are looking for…" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <Field label="Requirements" hint="One per line — e.g. 2+ years of experience.">
          <TextArea rows={4} placeholder={"2+ years of experience\nStrong HTML, CSS and JavaScript"} value={requirements} onChange={(e) => setRequirements(e.target.value)} />
        </Field>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            <Briefcase size={16} /> {busy ? "Posting…" : "Post job"}
          </Button>
        </div>
      </form>
    </div>
  );
}

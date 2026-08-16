import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Field, Select, TextArea, TextInput } from "../components/Field";
import { CATEGORIES, getSubcategoriesByCategoryId } from "../lib/categories";

interface PackageForm {
  name: string;
  price: string;
  description: string;
  deliveryDays: string;
}

const emptyPackage = (): PackageForm => ({ name: "", price: "", description: "", deliveryDays: "" });

const PACKAGE_NAMES = ["Basic", "Standard", "Premium"];

export default function CreateGig() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [subcategory, setSubcategory] = useState("");
  const [packages, setPackages] = useState<PackageForm[]>([emptyPackage()]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const availableSubcategories = useMemo(() => {
    return getSubcategoriesByCategoryId(categoryId);
  }, [categoryId]);

  const updatePackage = (index: number, key: keyof PackageForm, value: string) => {
    setPackages((prev) => prev.map((p, i) => (i === index ? { ...p, [key]: value } : p)));
  };

  const addPackage = () => {
    setPackages((prev) => [...prev, emptyPackage()]);
  };

  const removePackage = (index: number) => {
    setPackages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const cleaned = packages.map((p, i) => ({
      name: p.name || PACKAGE_NAMES[i] || "Package " + (i + 1),
      price: parseInt(p.price, 10),
      description: p.description,
      deliveryDays: parseInt(p.deliveryDays, 10)
    }));

    setBusy(true);
    try {
      await api.createGig({ title, description, category: subcategory || categoryId, packages: cleaned });
      navigate("/my-gigs");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <PageHeader title="Create a gig" subtitle="Package your service and start selling." />

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Gig title">
              <TextInput required placeholder="e.g. I will design a professional logo" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
          </div>
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
        </div>

        <Field label="Description" hint="What exactly will the buyer get? Be specific.">
          <TextArea rows={5} required placeholder="Describe your service…" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Packages</h3>
            <Button type="button" variant="secondary" size="sm" onClick={addPackage} disabled={packages.length >= 3}>
              <Plus size={15} /> Add package
            </Button>
          </div>

          <div className="space-y-4">
            {packages.map((pkg, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Package {index + 1}</span>
                  {packages.length > 1 && (
                    <button type="button" onClick={() => removePackage(index)} className="text-slate-400 transition hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <TextInput placeholder={PACKAGE_NAMES[index] || "Basic"} value={pkg.name} onChange={(e) => updatePackage(index, "name", e.target.value)} />
                  </Field>
                  <Field label="Price (KSh)">
                    <TextInput type="number" min={0} required placeholder="e.g. 1500" value={pkg.price} onChange={(e) => updatePackage(index, "price", e.target.value)} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="What's included?">
                      <TextInput placeholder="e.g. 3 logo concepts, 5 revisions" value={pkg.description} onChange={(e) => updatePackage(index, "description", e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Delivery days">
                    <TextInput type="number" min={1} required placeholder="e.g. 5" value={pkg.deliveryDays} onChange={(e) => updatePackage(index, "deliveryDays", e.target.value)} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            <Sparkles size={16} /> {busy ? "Creating…" : "Publish gig"}
          </Button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import type { Gig } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { GigCard } from "../components/GigCard";
import { EmptyState } from "../components/EmptyState";
import { Field, Select, TextInput } from "../components/Field";
import { Button } from "../components/Button";
import { CATEGORIES, getSubcategoriesByCategoryId } from "../lib/categories";

export default function Gigs() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("All");
  const [subcategory, setSubcategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const availableSubcategories = useMemo(() => {
    if (categoryId === "All") return [];
    return getSubcategoriesByCategoryId(categoryId);
  }, [categoryId]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setSubcategory("All");
  }, [categoryId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const filters: Record<string, string> = {};
    if (debouncedSearch) filters.search = debouncedSearch;
    if (subcategory !== "All") {
      filters.category = subcategory;
    } else if (categoryId !== "All") {
      filters.category = categoryId;
    }
    if (sort !== "newest") filters.sort = sort;

    api
      .getGigs(filters)
      .then((data) => !cancelled && setGigs(data.gigs))
      .catch((err) => !cancelled && setError((err as Error).message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, categoryId, subcategory, sort]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Explore gigs"
        subtitle="Buy professional services with clear pricing and delivery times."
        actions={
          <LinkToCreateGig />
        }
      />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Field label="Search">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <TextInput placeholder="Search gigs…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </Field>
          </div>
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="All">All Categories</option>
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
                <option value="All">All Subcategories</option>
                {availableSubcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Sort">
            <Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="priceLow">Price: low to high</option>
              <option value="priceHigh">Price: high to low</option>
            </Select>
          </Field>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          {loading ? "Searching…" : `${gigs.length} gig${gigs.length === 1 ? "" : "s"} found`}
        </p>
      </div>

      {error && <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : gigs.length === 0 ? (
        <EmptyState icon={<Sparkles size={36} />} title="No gigs match your filters" subtitle="Try a different search or category." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {gigs.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      )}
    </div>
  );
}

function LinkToCreateGig() {
  return (
    <Link to="/create-gig">
      <Button variant="secondary">
        <Sparkles size={16} /> Create a gig
      </Button>
    </Link>
  );
}

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { api } from "../lib/api";

export function SaveButton({ type, id }: { type: "job" | "gig"; id: number }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (type === "job") {
        if (saved) await api.unsaveJob(id);
        else await api.saveJob(id);
      } else {
        if (saved) await api.unsaveGig(id);
        else await api.saveGig(id);
      }
      setSaved(!saved);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
        saved
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}

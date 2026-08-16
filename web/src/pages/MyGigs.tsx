import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { api } from "../lib/api";
import type { Gig } from "../lib/types";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { GigCard } from "../components/GigCard";

export default function MyGigs() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .myGigs()
      .then((data) => !cancelled && setGigs(data.gigs))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="My gigs"
        subtitle="Gigs you're selling."
        actions={
          <Link to="/create-gig">
            <Button>
              <Sparkles size={16} /> Create a gig
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : gigs.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={36} />}
          title="No gigs yet"
          subtitle="Turn your skills into services and start earning."
          action={
            <Link to="/create-gig">
              <Button>Create your first gig</Button>
            </Link>
          }
        />
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

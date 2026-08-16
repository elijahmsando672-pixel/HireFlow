import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Github, Linkedin, MessageSquare, Twitter } from "lucide-react";
import { api } from "../lib/api";
import type { PublicUser } from "../lib/types";
import { initials } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { StarRating } from "../components/StarRating";

const LINKS = [
  { key: "github", icon: Github, label: "GitHub" },
  { key: "linkedin", icon: Linkedin, label: "LinkedIn" },
  { key: "twitter", icon: Twitter, label: "Twitter" }
] as const;

export default function Profile() {
  const { id } = useParams();
  const userId = parseInt(id || "0", 10);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .getUser(userId)
      .then((data) => !cancelled && setProfile(data.user))
      .catch((err) => !cancelled && setError((err as Error).message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const message = () => navigate("/messages?user=" + userId);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-500">{error || "User not found."}</p>
        <button onClick={() => navigate(-1)} className="mt-4 font-semibold text-indigo-600">
          ← Go back
        </button>
      </div>
    );
  }

  const isMe = user?.id === profile.id;

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-violet-600" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-8 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-2xl font-black text-indigo-700 shadow-sm ring-4 ring-white">
                {initials(profile.firstName, profile.lastName)}
              </span>
              <div className="pb-1">
                <h1 className="text-xl font-black text-slate-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                {profile.headline && <p className="text-sm font-medium text-indigo-700">{profile.headline}</p>}
              </div>
            </div>
            {!isMe && user && (
              <Button onClick={message}>
                <MessageSquare size={16} /> Message
              </Button>
            )}
          </div>

          <div className="mt-5">
            <StarRating rating={profile.rating} count={profile.reviewCount} />
          </div>

          {profile.bio && <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-600">{profile.bio}</p>}

          {profile.skills.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-bold text-slate-900">Skills</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.skills.map((skill, i) => (
                  <span key={i} className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(profile.github || profile.linkedin || profile.twitter || profile.portfolio) && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap gap-2">
                {profile.portfolio && (
                  <a
                    href={profile.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    <ExternalLink size={14} /> Portfolio
                  </a>
                )}
                {LINKS.map((link) => {
                  const url = profile[link.key];
                  if (!url) return null;
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      <Icon size={14} /> {link.label}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

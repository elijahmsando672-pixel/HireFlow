import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Button } from "../components/Button";
import { Field, TextArea, TextInput } from "../components/Field";

export default function AddBio() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [headline, setHeadline] = useState(user?.headline || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState((user?.skills || []).join(", "));
  const [interests, setInterests] = useState((user?.interests || []).join(", "));
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [github, setGithub] = useState(user?.github || "");
  const [twitter, setTwitter] = useState(user?.twitter || "");
  const [portfolio, setPortfolio] = useState(user?.portfolio || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const splitList = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await api.updateProfile({
        headline,
        bio,
        skills: splitList(skills),
        interests: splitList(interests),
        linkedin,
        github,
        twitter,
        portfolio
      });
      setUser(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-black text-white">
            {user ? user.firstName.charAt(0) : "?"}
          </span>
          <h1 className="mt-4 text-2xl font-black text-slate-900">Tell us about your work</h1>
          <p className="mt-1 text-sm text-slate-500">Step 2 of 2 — headline, bio, skills & links</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <Field label="Headline" hint="One line that sums up what you do — e.g. Frontend Developer @ Freelance">
            <TextInput placeholder="e.g. Frontend Developer & UI enthusiast" value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </Field>

          <Field label="Bio" hint="Tell clients about your experience and the value you bring.">
            <TextArea rows={4} placeholder="I build responsive websites..." value={bio} onChange={(e) => setBio(e.target.value)} />
          </Field>

          <Field label="Skills" hint="Comma-separated, e.g. HTML, CSS, JavaScript, Figma">
            <TextInput placeholder="HTML, CSS, JavaScript" value={skills} onChange={(e) => setSkills(e.target.value)} />
          </Field>

          <Field label="Interests" hint="What work do you want to attract? Comma-separated.">
            <TextInput placeholder="Web design, Branding, UX" value={interests} onChange={(e) => setInterests(e.target.value)} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="LinkedIn">
              <TextInput placeholder="https://linkedin.com/in/..." value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            </Field>
            <Field label="GitHub">
              <TextInput placeholder="https://github.com/..." value={github} onChange={(e) => setGithub(e.target.value)} />
            </Field>
            <Field label="Twitter / X">
              <TextInput placeholder="https://twitter.com/..." value={twitter} onChange={(e) => setTwitter(e.target.value)} />
            </Field>
            <Field label="Portfolio">
              <TextInput placeholder="https://your-site.com" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
            </Field>
          </div>

          <div className="flex gap-3">
            <Link to="/onboarding" className="w-full">
              <Button variant="secondary" className="w-full" type="button">
                Back
              </Button>
            </Link>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

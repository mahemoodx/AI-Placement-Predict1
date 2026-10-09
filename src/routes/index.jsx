import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Bot, Brain, FileSpreadsheet, LineChart, Sparkles, Upload, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { usePlacementData } from "@/lib/placement-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlaceReady | AI College Placement Prediction" },
      {
        name: "description",
        content:
          "PlaceReady turns assessment CSV data into placement readiness scores, ML-backed probability bands and AI recommendations for placement officers.",
      },
      { property: "og:title", content: "PlaceReady | AI College Placement Prediction" },
      {
        property: "og:description",
        content: "Predict placement probability, not promises — ML analytics for whole colleges and single students.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const BANDS = [
  { label: "Highly Placement Ready", range: "85% – 100%", chance: "80–95% chance", dot: "bg-success" },
  { label: "Good Preparation", range: "70% – 84%", chance: "60–80% chance", dot: "bg-primary" },
  { label: "Average", range: "50% – 69%", chance: "40–60% chance", dot: "bg-warning" },
  { label: "Needs Training", range: "Below 50%", chance: "< 40% chance", dot: "bg-destructive" },
];

const FEATURES = [
  { icon: Brain, title: "ML Prediction", desc: "Weighted scoring across CGPA, aptitude, reasoning, English, coding and DSA." },
  { icon: Users, title: "Student Analytics", desc: "Topic-wise progress, radar profiles and company eligibility per student." },
  { icon: Bot, title: "AI Assistant", desc: "Ask AI about any student in Basic or Advanced mode with full context preloaded." },
  { icon: BarChart3, title: "Business Intelligence", desc: "Branch KPIs, rankings, risk panels and export-ready reports." },
  { icon: FileSpreadsheet, title: "CSV Upload", desc: "Sub-topics are detected automatically from your uploaded assessment sheet." },
  { icon: LineChart, title: "Explainable AI", desc: "Feature importance and plain-language reasoning behind every prediction." },
];

function Home() {
  const { students, hasData, fileName } = usePlacementData();
  const counts = BANDS.map((b) => students.filter((s) => s.prediction.category === b.label).length);
  const avg = students.length
    ? Math.round(students.reduce((t, s) => t + s.prediction.probability, 0) / students.length)
    : 0;

  return (
    <AppShell>
      {/* Hero */}
      <section className="hero-surface relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-24">
        <div className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-white/15 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium backdrop-blur">
            <Sparkles className="size-3.5" /> ML-inspired Placement Readiness scoring
          </span>
          <h1 className="mx-auto mt-8 max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Predict placement <span className="opacity-75">probability</span>, not promises.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed opacity-90 sm:text-base">
            A Business Analytics tool that turns assessment scores into a Placement Readiness Score and a realistic
            probability band — for individual students and whole colleges.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/ai-predictor"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[var(--primary)] transition-transform hover:-translate-y-0.5"
            >
              Predict a student <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-semibold backdrop-blur transition-transform hover:-translate-y-0.5"
            >
              <Upload className="size-4" /> Upload college data
            </Link>
          </div>
          <p className="mt-8 text-xs opacity-85">
            {hasData
              ? `Using ${fileName} · ${students.length} students · average probability ${avg}%`
              : "No dataset loaded yet — upload a CSV to generate every result."}
          </p>
        </div>
      </section>

      {/* Readiness bands */}
      <section className="mt-16">
        <h2 className="font-display text-3xl font-bold tracking-tight">The readiness bands</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every readiness score falls into one of four probability categories.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BANDS.map((b, i) => (
            <div key={b.label} className="panel p-6">
              <span className={`block size-3 rounded-full ${b.dot}`} />
              <div className="mt-5 font-mono text-xs uppercase tracking-wider text-muted-foreground">{b.range}</div>
              <div className="mt-2 text-base font-semibold">{b.label}</div>
              <div className="mt-4 font-display text-3xl font-bold leading-tight">{b.chance}</div>
              <div className="mt-3 text-xs text-muted-foreground">
                {hasData ? `${counts[i]} students in this band` : "Awaiting CSV upload"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="mt-16">
        <h2 className="font-display text-3xl font-bold tracking-tight">What the platform does</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="panel p-6 transition-transform hover:-translate-y-0.5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="size-5" />
              </span>
              <div className="mt-4 font-display text-lg font-semibold">{title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
        <span>PlaceReady · Business Analytics project</span>
        <span>Probabilistic placement readiness — not a job guarantee.</span>
      </footer>
    </AppShell>
  );
}

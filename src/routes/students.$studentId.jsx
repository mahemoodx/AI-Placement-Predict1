import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Download, Printer, TrendingDown, TrendingUp, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Gauge } from "@/components/Gauge";
import { StudentChat } from "@/components/StudentChat";
import { TopicCard } from "@/components/TopicCard";
import { printReport } from "@/lib/export-report";
import { allTopics, bandColor, statusOf } from "@/lib/placement-data";
import { usePlacementData } from "@/lib/placement-store";
import {
  NOT_AVAILABLE,
  companyTiers,
  expectedImprovement,
  improvementPlan,
  peerStats,
  statusTone,
  strongAreas,
  weakAreas,
} from "@/lib/analytics";
import { sectionRank, suitableRoles } from "@/lib/recommendations";

export const Route = createFileRoute("/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student Placement Profile | Placement Partner AI" },
      {
        name: "description",
        content:
          "Topic-wise aptitude, reasoning, English, coding and DSA analysis with placement probability and explainable AI.",
      },
      { property: "og:title", content: "Student Placement Profile | Placement Partner AI" },
      { property: "og:description", content: "Individual placement readiness analysis generated from the uploaded CSV." },
    ],
  }),
  component: StudentProfile,
});

function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "S";
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide opacity-75">{label}</p>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function AssessmentCard({ label, value, unit = "%" }) {
  const status = statusOf(value);
  return (
    <div className="panel relative overflow-hidden p-4">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${bandColor(value)}, var(--chart-3))` }}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(status)}`}>{status}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-semibold" style={{ color: bandColor(value) }}>
        {Math.round(value)}
        {unit}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.round(value)}%`, background: bandColor(value) }}
        />
      </div>
    </div>
  );
}

function StudentProfile() {
  const { studentId } = Route.useParams();
  const { students } = usePlacementData();
  const student = students.find((s) => s.id === studentId);

  if (!student) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">
          Student not found in the current dataset.{" "}
          <Link to="/students" className="text-primary underline">
            Back to students
          </Link>
        </p>
      </AppShell>
    );
  }

  const p = student.prediction;
  const topics = allTopics(student);
  const strong = strongAreas(topics, 80);
  const weak = weakAreas(topics, 60);
  const peers = peerStats(student, students);
  const plans = improvementPlan(weak, p);
  const tiers = companyTiers(p);
  const lift = expectedImprovement(p, weak);
  const ranked = sectionRank(p);

  const skills = [
    { skill: "Aptitude", value: p.aptitudeAvg },
    { skill: "Reasoning", value: p.reasoningAvg },
    { skill: "English", value: p.englishAvg },
    { skill: "Coding", value: p.coding },
    { skill: "DSA", value: p.dsa },
  ];

  return (
    <AppShell>
      {/* Profile header */}
      <section className="hero-surface panel mb-6 p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 font-display text-xl font-semibold backdrop-blur">
              {initials(student.name)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-semibold">{student.name}</h1>
              <p className="truncate text-sm opacity-90">
                {student.id} · {student.email || NOT_AVAILABLE}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white/20 px-2.5 py-1 font-semibold backdrop-blur">{p.category}</span>
                <span className="rounded-full bg-white/20 px-2.5 py-1 font-semibold backdrop-blur">
                  {p.probability >= 50 ? "Likely Placed" : "Needs Training"}
                </span>
              </div>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
            <Info label="Branch" value={student.branch} />
            <Info label="CGPA" value={student.cgpa ?? NOT_AVAILABLE} />
            <Info label="Placement probability" value={`${Math.round(p.probability)}%`} />
            <Info label="Overall score" value={`${Math.round(p.overall)}%`} />
          </div>
        </div>

        <div className="no-print mt-5 flex flex-wrap gap-2">
          <button
            onClick={printReport}
            className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25"
          >
            <Download className="size-4" /> Download PDF
          </button>
          <button
            onClick={printReport}
            className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25"
          >
            <Printer className="size-4" /> Print
          </button>
          <Link
            to="/students"
            className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25"
          >
            <ArrowLeft className="size-4" /> Back to Students
          </Link>
          <StudentChat student={student} cohort={students} />
        </div>
      </section>

      {/* Assessment cards */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <AssessmentCard label="Aptitude" value={p.aptitudeAvg} />
        <AssessmentCard label="Reasoning" value={p.reasoningAvg} />
        <AssessmentCard label="English" value={p.englishAvg} />
        <AssessmentCard label="Coding" value={p.coding} />
        <AssessmentCard label="DSA" value={p.dsa} />
        <AssessmentCard label="CGPA" value={p.cgpaPct} />
      </section>

      {/* Performance dashboard */}
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-5">
          <h2 className="mb-3 text-sm font-semibold">Assessment comparison</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={skills}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="skill" fontSize={11} />
              <YAxis domain={[0, 100]} fontSize={11} />
              <Tooltip formatter={(v) => `${Math.round(v)}%`} />
              <Bar dataKey="value" name="Score" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel p-5">
          <h2 className="mb-3 text-sm font-semibold">Skill profile</h2>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={skills}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" fontSize={11} />
              <Radar dataKey="value" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.35} />
              <Tooltip formatter={(v) => `${Math.round(v)}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel flex flex-col items-center justify-center p-5">
          <h2 className="mb-1 self-start text-sm font-semibold">Placement probability</h2>
          <Gauge value={p.probability} label={p.category} />
          <div className="mt-3 grid w-full grid-cols-2 gap-3 text-center text-sm">
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Overall score</p>
              <p className="font-display text-lg font-semibold">{Math.round(p.overall)}%</p>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-xs text-muted-foreground">Prediction</p>
              <p className="font-display text-lg font-semibold" style={{ color: bandColor(p.probability) }}>
                {p.probability >= 50 ? "Likely Placed" : "Not Placed"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Topic-wise analysis */}
      <h2 className="mb-3 font-display text-lg font-semibold">Topic-wise analysis</h2>
      <section className="mb-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <TopicCard title="Aptitude" topics={student.aptitude} average={p.aptitudeAvg} />
        <TopicCard title="Reasoning" topics={student.reasoning} average={p.reasoningAvg} />
        <TopicCard title="English" topics={student.english} average={p.englishAvg} />
        <TopicCard title="Coding" topics={student.codingTopics} average={p.coding} />
        <TopicCard title="DSA" topics={student.dsaTopics} average={p.dsa} />
        <div className="panel p-5">
          <h3 className="font-display text-base font-semibold">Section averages</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {skills.map((s) => (
              <li key={s.skill}>
                <div className="flex justify-between">
                  <span>{s.skill}</span>
                  <span className="font-semibold">
                    {s.value.toFixed(1)}% · {statusOf(s.value)}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.round(s.value)}%`, background: bandColor(s.value) }}
                  />
                </div>
              </li>
            ))}
            <li className="pt-2 text-xs text-muted-foreground">{topics.length} CSV sub-topics analysed.</li>
          </ul>
        </div>
      </section>

      {/* AI performance analysis */}
      <h2 className="mb-3 font-display text-lg font-semibold">AI performance analysis</h2>
      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-success">
            <TrendingUp className="size-4" /> Strong areas — sub-topics ≥ 80%
          </h3>
          {strong.length ? (
            <ul className="mt-3 space-y-3 text-sm">
              {strong.map((t) => (
                <li key={`${t.section}-${t.topic}`} className="rounded-lg bg-secondary p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">
                      {t.topic} <span className="text-muted-foreground">· {t.section}</span>
                    </span>
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                      {Math.round(t.score)}% · {t.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.note}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No sub-topic reaches 80% yet.</p>
          )}
        </div>
        <div className="panel p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <TrendingDown className="size-4" /> Weak areas — sub-topics &lt; 60%
          </h3>
          {weak.length ? (
            <ul className="mt-3 space-y-3 text-sm">
              {weak.map((t) => (
                <li key={`${t.section}-${t.topic}`} className="rounded-lg bg-secondary p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">
                      {t.topic} <span className="text-muted-foreground">· {t.section}</span>
                    </span>
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                      {Math.round(t.score)}% · {t.priority} priority
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.note}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No sub-topic is below 60% — strong foundation.</p>
          )}
        </div>
      </section>

      {/* Personalized recommendations */}
      <section className="panel mb-6 p-5">
        <h2 className="font-display text-lg font-semibold">Personalized recommendations</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Current readiness", value: `${Math.round(p.overall)}% · ${p.category}` },
            { label: "Strongest skill", value: `${ranked[0].section} (${ranked[0].value.toFixed(1)}%)` },
            { label: "Weakest skill", value: `${ranked[ranked.length - 1].section} (${ranked[ranked.length - 1].value.toFixed(1)}%)` },
            {
              label: "Recommended training",
              value: weak.length ? weak.slice(0, 2).map((t) => t.topic).join(", ") : suitableRoles(p)[0],
            },
            {
              label: "Expected improvement",
              value: lift.lift ? `+${lift.lift}% → ${lift.target}%` : "Already at peak band",
            },
          ].map((c) => (
            <div key={c.label} className="rounded-lg bg-secondary p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-sm font-semibold">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.window} className="rounded-xl border border-border p-4">
              <h3 className="font-display text-base font-semibold text-primary">{plan.window}</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {plan.focus.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.tier} className="rounded-xl bg-secondary p-4 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.tier}</p>
              {t.names ? (
                <ul className="mt-1 space-y-0.5">
                  {t.names.map((n) => (
                    <li key={n}>• {n}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-muted-foreground">{NOT_AVAILABLE}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Peer comparison */}
      <section className="panel mb-6 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Users className="size-4 text-primary" /> Peer comparison
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Branch rank", value: `#${peers.branchRank} of ${peers.branchTotal}` },
            { label: "College rank", value: `#${peers.collegeRank} of ${peers.collegeTotal}` },
            { label: "Percentile", value: `${peers.percentile}th` },
            { label: "Top %", value: `Top ${peers.topPercent}%` },
          ].map((c) => (
            <div key={c.label} className="rounded-lg bg-secondary p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
              <p className="mt-1 font-display text-xl font-semibold">{c.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold">Student vs cohort average</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={peers.averages.map((a) => ({ label: a.label, Student: Math.round(a.you), Cohort: Math.round(a.cohort) }))}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis domain={[0, 100]} fontSize={11} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              <Bar dataKey="Student" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Cohort" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Explainable AI */}
      <section className="panel mb-6 p-5">
        <h2 className="text-sm font-semibold">Feature importance — why this prediction?</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={p.featureImportance.map((f) => ({ feature: f.feature, importance: Math.round(f.weight * 100) }))}
            layout="vertical"
            margin={{ left: 18 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis type="number" domain={[0, 40]} unit="%" fontSize={11} />
            <YAxis type="category" dataKey="feature" width={78} fontSize={11} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="importance" name="Model weight" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-2 rounded-lg bg-secondary p-3 text-sm">
          The model weighs Coding 35%, DSA 25%, CGPA 18%, Aptitude 12%, Reasoning 7% and English 3%. For {student.name}{" "}
          this produces an overall score of {Math.round(p.overall)}% and a {Math.round(p.probability)}% placement
          probability ({p.category}). This prediction estimates placement probability based on assessment performance.
          It is not a job guarantee.
        </p>
      </section>
    </AppShell>
  );
}

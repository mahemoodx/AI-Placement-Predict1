import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Download, FileSpreadsheet, Printer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/AppShell";
import { Gauge } from "@/components/Gauge";
import { StudentChat } from "@/components/StudentChat";
import { exportStudentsCsv, exportStudentsExcel, printReport } from "@/lib/export-report";
import { allTopics, bandColor } from "@/lib/placement-data";
import { usePlacementData } from "@/lib/placement-store";
import {
  NOT_AVAILABLE,
  companyTiers,
  explanationBullets,
  improvementPlan,
  modelConfidence,
  scoreBreakdown,
  statusTone,
  strongAreas,
  weakAreas,
} from "@/lib/analytics";

export const Route = createFileRoute("/report/$studentId")({
  head: () => ({
    meta: [
      { title: "AI Placement Report | Placement Partner AI" },
      {
        name: "description",
        content: "Final machine learning placement prediction summary with score breakdown, explainability and a 30/60/90-day plan.",
      },
      { property: "og:title", content: "AI Placement Report | Placement Partner AI" },
      { property: "og:description", content: "Machine learning placement readiness report generated from the uploaded CSV." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { studentId } = Route.useParams();
  const { students } = usePlacementData();
  const student = students.find((s) => s.id === studentId);

  if (!student) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">
          Student not found in the current dataset.{" "}
          <Link to="/ai-officer" className="text-primary underline">
            Back to AI Prediction Center
          </Link>
        </p>
      </AppShell>
    );
  }

  const p = student.prediction;
  const topics = allTopics(student);
  const strong = strongAreas(topics, 80);
  const weak = weakAreas(topics, 60);
  const rows = scoreBreakdown(p);
  const bullets = explanationBullets(student, p, strong, weak);
  const plans = improvementPlan(weak, p);
  const tiers = companyTiers(p);
  const confidence = modelConfidence(p);
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  return (
    <AppShell>
      {/* Header */}
      <section className="hero-surface panel p-6">
        <h1 className="font-display text-2xl font-semibold">AI Placement Report</h1>
        <p className="text-sm opacity-90">Final Machine Learning Prediction Summary</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Student name", student.name],
            ["Student ID", student.id],
            ["Email", student.email || NOT_AVAILABLE],
            ["Branch", student.branch],
            ["CGPA", student.cgpa ?? NOT_AVAILABLE],
            ["Prediction date", date],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide opacity-75">{label}</p>
              <p className="truncate text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 1 — headline prediction */}
      <section className="panel mt-6 flex flex-col items-center gap-6 p-8 lg:flex-row lg:justify-center">
        <Gauge value={p.probability} label="Placement probability" size={200} />
        <div className="grid w-full max-w-lg gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-secondary p-4 text-center">
            <p className="text-xs uppercase text-muted-foreground">Readiness badge</p>
            <p className="mt-1 font-display text-base font-semibold">{p.category}</p>
          </div>
          <div className="rounded-xl bg-secondary p-4 text-center">
            <p className="text-xs uppercase text-muted-foreground">Prediction result</p>
            <p className="mt-1 font-display text-base font-semibold" style={{ color: bandColor(p.probability) }}>
              {p.probability >= 50 ? "Likely Placed" : "Not Placed"}
            </p>
          </div>
          <div className="rounded-xl bg-secondary p-4 text-center">
            <p className="text-xs uppercase text-muted-foreground">Model confidence</p>
            <p className="mt-1 font-display text-base font-semibold">{confidence}%</p>
          </div>
        </div>
      </section>

      {/* Section 2 — score breakdown */}
      <section className="panel mt-6 overflow-hidden">
        <h2 className="border-b border-border p-4 text-sm font-semibold">Score breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-secondary text-xs">
              <tr>
                {["Category", "Score", "Weight", "Contribution", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.category} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{r.category}</td>
                  <td className="px-3 py-2">{r.score}%</td>
                  <td className="px-3 py-2">{r.weight}%</td>
                  <td className="px-3 py-2">{r.contribution}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTone(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-border bg-secondary/60 font-semibold">
                <td className="px-3 py-2">Final readiness score</td>
                <td className="px-3 py-2" colSpan={3}>
                  {Math.round(p.overall)}%
                </td>
                <td className="px-3 py-2">{p.category}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3 — explainability */}
      <section className="panel mt-6 p-5">
        <h2 className="text-sm font-semibold">Why this prediction?</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={p.featureImportance.map((f) => ({ feature: f.feature, importance: Math.round(f.weight * 100) }))}
            layout="vertical"
            margin={{ left: 18 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis type="number" domain={[0, 40]} unit="%" fontSize={11} />
            <YAxis type="category" dataKey="feature" width={80} fontSize={11} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="importance" name="Model weight" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <ul className="mt-3 space-y-1.5 text-sm">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-lg bg-secondary p-3 text-sm font-medium">
          This prediction estimates placement probability based on assessment performance. It is not a job guarantee.
        </p>
      </section>

      {/* Section 4 — strong / weak sub-topics */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-success">Strong areas (sub-topics ≥ 80%)</h2>
          {strong.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {strong.map((t) => (
                <li key={`${t.section}-${t.topic}`} className="rounded-lg bg-secondary p-3">
                  <span className="font-semibold">
                    {t.topic} · {t.section} — {Math.round(t.score)}%
                  </span>
                  <p className="text-xs text-muted-foreground">{t.note}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No sub-topic reaches 80% yet.</p>
          )}
        </div>
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-destructive">Weak areas (sub-topics &lt; 60%)</h2>
          {weak.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {weak.map((t) => (
                <li key={`${t.section}-${t.topic}`} className="rounded-lg bg-secondary p-3">
                  <span className="font-semibold">
                    {t.topic} · {t.section} — {Math.round(t.score)}%
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {t.note} Improvement priority: {t.priority}.
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No sub-topic is below 60%.</p>
          )}
        </div>
      </section>

      {/* Section 5 — improvement plan */}
      <section className="panel mt-6 p-5">
        <h2 className="font-display text-lg font-semibold">Personalized improvement plan</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
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

      {/* Section 6 — actions */}
      <section className="no-print mt-6 flex flex-wrap gap-3">
        <button
          onClick={printReport}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Download className="size-4" /> Download PDF
        </button>
        <button
          onClick={() => exportStudentsExcel([student], `${student.id}-ai-placement-report.xls`)}
          className="flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium"
        >
          <FileSpreadsheet className="size-4" /> Export Excel
        </button>
        <button
          onClick={() => exportStudentsCsv([student], `${student.id}-ai-placement-report.csv`)}
          className="flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium"
        >
          <FileSpreadsheet className="size-4" /> Export CSV
        </button>
        <button
          onClick={printReport}
          className="flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium"
        >
          <Printer className="size-4" /> Print Report
        </button>
        <StudentChat student={student} cohort={students} />
        <Link
          to="/ai-officer"
          className="flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium"
        >
          <ArrowLeft className="size-4" /> Back to AI Prediction Center
        </Link>
      </section>
    </AppShell>
  );
}

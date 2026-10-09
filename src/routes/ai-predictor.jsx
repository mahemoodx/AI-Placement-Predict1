import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { bandColor, categoryOf, predictFromScores, statusOf } from "@/lib/placement-data";
import { recommendations, sectionRank, suggestedCompanies, suitableRoles } from "@/lib/recommendations";

export const Route = createFileRoute("/ai-predictor")({
  head: () => ({
    meta: [
      { title: "AI Predictor | Placement Partner AI" },
      {
        name: "description",
        content: "Enter aptitude, reasoning, English, coding, DSA and CGPA values to predict placement probability live.",
      },
      { property: "og:title", content: "AI Predictor | Placement Partner AI" },
      { property: "og:description", content: "Instant manual placement prediction with explainable AI." },
    ],
  }),
  component: AiPredictor,
});

const FIELDS = [
  { key: "aptitude", label: "Aptitude", max: 100 },
  { key: "reasoning", label: "Reasoning", max: 100 },
  { key: "english", label: "English", max: 100 },
  { key: "coding", label: "Coding", max: 100 },
  { key: "dsa", label: "DSA", max: 100 },
];

function NumberField({ label, value, onChange, max, step = 1 }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-card px-3 py-2 text-base font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
      />
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={Number(value) || 0}
        onChange={(e) => onChange(e.target.value)}
        className="accent-primary"
      />
    </label>
  );
}

function AiPredictor() {
  const [name, setName] = useState("");
  const [v, setV] = useState({ aptitude: 70, reasoning: 68, english: 72, coding: 65, dsa: 62 });
  const [cgpa, setCgpa] = useState(7.5);

  const set = (k) => (val) => setV((prev) => ({ ...prev, [k]: val === "" ? "" : Number(val) }));

  const p = useMemo(() => {
    const base = predictFromScores({
      aptitude: Number(v.aptitude) || 0,
      reasoning: Number(v.reasoning) || 0,
      english: Number(v.english) || 0,
      coding: Number(v.coding) || 0,
      dsa: Number(v.dsa) || 0,
      cgpa: cgpa === "" ? null : Number(cgpa),
    });
    return { ...base, category: categoryOf(base.probability) };
  }, [v, cgpa]);

  const skills = [
    { skill: "Aptitude", value: p.aptitudeAvg },
    { skill: "Reasoning", value: p.reasoningAvg },
    { skill: "English", value: p.englishAvg },
    { skill: "Coding", value: p.coding },
    { skill: "DSA", value: p.dsa },
  ];
  const asTopics = skills.map((s) => ({ topic: s.skill, section: s.skill, score: s.value }));
  const strengths = asTopics.filter((t) => t.score >= 75).sort((a, b) => b.score - a.score);
  const weaknesses = asTopics.filter((t) => t.score < 60).sort((a, b) => a.score - b.score);
  const recs = recommendations(p, weaknesses, strengths);
  const ranked = sectionRank(p);
  const displayName = name.trim() || "This student";

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold">AI Predictor</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter assessment scores manually — the prediction, charts and recommendations update instantly.
      </p>

      <section className="panel mt-5 p-5">
        <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Student name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter student name"
            className="rounded-lg border border-input bg-card px-3 py-2 text-base font-medium text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <NumberField key={f.key} label={f.label} value={v[f.key]} onChange={set(f.key)} max={f.max} />
          ))}
          <NumberField label="CGPA (0-10)" value={cgpa} onChange={(x) => setCgpa(x === "" ? "" : Number(x))} max={10} step={0.01} />
        </div>
      </section>

      {/* Live prediction */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Placement probability", value: `${Math.round(p.probability)}%`, tone: bandColor(p.probability) },
          { label: "Placement category", value: p.category },
          { label: "Readiness score", value: `${Math.round(p.overall)}%`, tone: bandColor(p.overall) },
          { label: "Prediction result", value: p.probability >= 50 ? "Likely Placed" : "Needs Training", tone: bandColor(p.probability) },
        ].map((c) => (
          <div key={c.label} className="panel p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</div>
            <div className="mt-1 font-display text-2xl font-semibold" style={c.tone ? { color: c.tone } : undefined}>
              {c.value}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="panel flex flex-col items-center justify-center p-5">
          <h2 className="mb-1 self-start text-sm font-semibold">Prediction gauge</h2>
          <Gauge value={p.probability} label={p.category} />
        </div>
        <div className="panel p-5">
          <h2 className="mb-3 text-sm font-semibold">Skill radar</h2>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={skills}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" fontSize={11} />
              <Radar dataKey="value" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.35} />
              <Tooltip formatter={(x) => `${Math.round(x)}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel p-5">
          <h2 className="mb-3 text-sm font-semibold">Feature importance</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={p.featureImportance.map((f) => ({ feature: f.feature, importance: Math.round(f.weight * 100) }))}
              layout="vertical"
              margin={{ left: 18 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" domain={[0, 40]} unit="%" fontSize={11} />
              <YAxis type="category" dataKey="feature" width={78} fontSize={11} />
              <Tooltip formatter={(x) => `${x}%`} />
              <Bar dataKey="importance" name="Model weight" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Summary */}
      <section className="panel mt-4 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Sparkles className="size-4 text-primary" /> AI Prediction Summary
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Overall performance</p>
            <p className="mt-1 text-sm">
              {displayName} scores {Math.round(p.overall)}% overall. Section standing:{" "}
              {ranked.map((r) => `${r.section} ${Math.round(r.value)}%`).join(", ")} — rated{" "}
              {statusOf(p.overall)}.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-success">Strengths</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {strengths.length ? (
                strengths.map((s) => <li key={s.topic}>✔ {s.topic} ({Math.round(s.score)}%)</li>)
              ) : (
                <li className="text-muted-foreground">No section is above 75% yet.</li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-destructive">Weaknesses</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {weaknesses.length ? (
                weaknesses.map((s) => <li key={s.topic}>✘ {s.topic} ({Math.round(s.score)}%)</li>)
              ) : (
                <li className="text-muted-foreground">No section below 60%. Strong foundation.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-secondary p-3 text-sm">
            <p className="text-xs uppercase text-muted-foreground">Placement probability</p>
            <p className="font-display text-xl font-semibold">{Math.round(p.probability)}%</p>
            <p className="text-xs text-muted-foreground">{p.category}</p>
          </div>
          <div className="rounded-lg bg-secondary p-3 text-sm">
            <p className="text-xs uppercase text-muted-foreground">Expected placement chance</p>
            <p>
              {p.probability >= 85
                ? "Very high — product and service companies"
                : p.probability >= 70
                  ? "High — most service companies"
                  : p.probability >= 50
                    ? "Moderate — with focused training"
                    : "Low — foundation training required"}
            </p>
          </div>
          <div className="rounded-lg bg-secondary p-3 text-sm">
            <p className="text-xs uppercase text-muted-foreground">Suitable roles</p>
            <ul className="mt-1 space-y-0.5">
              {suitableRoles(p).map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-secondary p-3 text-sm">
            <p className="text-xs uppercase text-muted-foreground">Suggested companies</p>
            <ul className="mt-1 space-y-0.5">
              {suggestedCompanies(p).map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">Recommended training</p>
          <ul className="mt-1 space-y-1 text-sm">
            {recs.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-primary">→</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}

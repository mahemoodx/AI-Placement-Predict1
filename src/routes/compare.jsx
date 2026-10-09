import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { usePlacementData } from "@/lib/placement-store";
import { allTopics, bandColor } from "@/lib/placement-data";
import { strongAreas, weakAreas } from "@/lib/analytics";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Students | Placement Partner AI" },
      { name: "description", content: "Side-by-side comparison of aptitude, reasoning, English, coding and DSA scores." },
      { property: "og:title", content: "Compare Students | Placement Partner AI" },
      { property: "og:description", content: "Benchmark two or three students across every placement assessment." },
    ],
  }),
  component: ComparePage,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
const METRICS = [
  ["Aptitude", "aptitudeAvg"],
  ["Reasoning", "reasoningAvg"],
  ["English", "englishAvg"],
  ["Coding", "coding"],
  ["DSA", "dsa"],
  ["Overall", "overall"],
  ["Probability", "probability"],
];

function Selector({ label, value, onChange, students, allowNone }) {
  return (
    <label className="flex min-w-52 flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        {allowNone ? <option value="">— none —</option> : null}
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — {s.branch} ({s.id})
          </option>
        ))}
      </select>
    </label>
  );
}

function ComparePage() {
  const { students } = usePlacementData();
  const [ids, setIds] = useState([students[0]?.id ?? "", students[1]?.id ?? "", ""]);
  const setAt = (i) => (v) => setIds((prev) => prev.map((x, j) => (j === i ? v : x)));

  const picked = ids.map((id) => students.find((s) => s.id === id)).filter(Boolean);
  const unique = picked.filter((s, i) => picked.findIndex((x) => x.id === s.id) === i);

  const barData = METRICS.map(([label, key]) => {
    const row = { metric: label };
    unique.forEach((s) => {
      row[s.name] = Math.round(s.prediction[key]);
    });
    return row;
  });

  const radarData = METRICS.slice(0, 5).map(([label, key]) => {
    const row = { skill: label };
    unique.forEach((s) => {
      row[s.name] = Math.round(s.prediction[key]);
    });
    return row;
  });

  const best = (key) =>
    unique.reduce((a, s) => (a && a.prediction[key] >= s.prediction[key] ? a : s), null);

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold">Compare Students</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Select two or three students to benchmark every assessment category side by side.
      </p>

      <section className="panel mt-4 flex flex-wrap items-end gap-3 p-4">
        <Selector label="Student 1" value={ids[0]} onChange={setAt(0)} students={students} />
        <Selector label="Student 2" value={ids[1]} onChange={setAt(1)} students={students} />
        <Selector label="Student 3 (optional)" value={ids[2]} onChange={setAt(2)} students={students} allowNone />
      </section>

      {unique.length < 2 ? (
        <p className="panel mt-4 p-6 text-sm text-muted-foreground">Pick at least two different students to compare.</p>
      ) : (
        <>
          {/* Side-by-side table */}
          <section className="panel mt-4 overflow-hidden">
            <h2 className="border-b border-border p-4 text-sm font-semibold">Side-by-side comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-secondary text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Metric</th>
                    {unique.map((s) => (
                      <th key={s.id} className="px-3 py-2 text-left font-medium">
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground">Branch</td>
                    {unique.map((s) => (
                      <td key={s.id} className="px-3 py-2">
                        {s.branch}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground">CGPA</td>
                    {unique.map((s) => (
                      <td key={s.id} className="px-3 py-2">
                        {s.cgpa ?? "Not available in dataset"}
                      </td>
                    ))}
                  </tr>
                  {METRICS.map(([label, key]) => {
                    const winner = best(key);
                    return (
                      <tr key={label} className="border-t border-border">
                        <td className="px-3 py-2 text-muted-foreground">{label}</td>
                        {unique.map((s) => {
                          const isBest = winner?.id === s.id;
                          return (
                            <td
                              key={s.id}
                              className={`px-3 py-2 ${isBest ? "font-semibold" : ""}`}
                              style={isBest ? { color: bandColor(s.prediction[key]) } : undefined}
                            >
                              {Math.round(s.prediction[key])}%{isBest ? " ▲" : ""}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground">Category</td>
                    {unique.map((s) => (
                      <td key={s.id} className="px-3 py-2 text-xs">
                        {s.prediction.category}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Charts */}
          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold">Grouped comparison</h2>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="metric" fontSize={11} />
                  <YAxis domain={[0, 100]} fontSize={11} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend />
                  {unique.map((s, i) => (
                    <Bar key={s.id} dataKey={s.name} fill={COLORS[i]} radius={[6, 6, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold">Radar overlay</h2>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" fontSize={11} />
                  {unique.map((s, i) => (
                    <Radar key={s.id} dataKey={s.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.22} />
                  ))}
                  <Legend />
                  <Tooltip formatter={(v) => `${v}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Probability + strengths / weaknesses */}
          <section className="mt-4 grid gap-4 lg:grid-cols-3">
            {unique.map((s, i) => {
              const topics = allTopics(s);
              const strong = strongAreas(topics, 80).slice(0, 3);
              const weak = weakAreas(topics, 60).slice(0, 3);
              return (
                <div key={s.id} className="panel p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-base font-semibold">{s.name}</h3>
                    <span className="size-3 rounded-full" style={{ background: COLORS[i] }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.branch} · {s.id}
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold" style={{ color: bandColor(s.prediction.probability) }}>
                    {Math.round(s.prediction.probability)}%
                    <span className="ml-2 text-xs font-medium text-muted-foreground">placement probability</span>
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase text-success">Strengths</p>
                  <ul className="text-sm">
                    {strong.length ? (
                      strong.map((t) => (
                        <li key={t.topic}>
                          ✔ {t.topic} ({Math.round(t.score)}%)
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No sub-topic ≥ 80%</li>
                    )}
                  </ul>
                  <p className="mt-3 text-xs font-medium uppercase text-destructive">Weaknesses</p>
                  <ul className="text-sm">
                    {weak.length ? (
                      weak.map((t) => (
                        <li key={t.topic}>
                          ✘ {t.topic} ({Math.round(t.score)}%)
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No sub-topic below 60%</li>
                    )}
                  </ul>
                  <Link
                    to="/students/$studentId"
                    params={{ studentId: s.id }}
                    className="mt-3 inline-block rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    Open profile
                  </Link>
                </div>
              );
            })}
          </section>
        </>
      )}
    </AppShell>
  );
}

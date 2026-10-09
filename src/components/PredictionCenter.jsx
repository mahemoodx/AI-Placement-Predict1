import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, FileSpreadsheet, Printer, Search, Sparkles } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Gauge } from "@/components/Gauge";
import { CATEGORIES, bandColor } from "@/lib/placement-data";
import { exportStudentsCsv, exportStudentsExcel, printReport } from "@/lib/export-report";
import { statusTone } from "@/lib/analytics";

function Card({ label, value, sub, tone }) {
  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-chart-3" />
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function Field({ label, value, onChange, options }) {
  return (
    <label className="flex min-w-40 flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PredictionCenter({ students }) {
  const [branch, setBranch] = useState("All");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All Categories");
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState(0);

  const branches = useMemo(() => ["All", ...new Set(students.map((s) => s.branch))].sort(), [students]);
  // Branch options come straight from the uploaded CSV; a stale selection from a
  // previous file resets to "All".
  const activeBranch = branches.includes(branch) ? branch : "All";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => {
        if (activeBranch !== "All" && s.branch !== activeBranch) return false;
        if (category !== "All Categories" && s.prediction.category !== category) return false;
        if (status !== "All") {
          const placed = s.prediction.probability >= 50;
          if (status === "Predicted Placed" && !placed) return false;
          if (status === "Predicted Not Placed" && placed) return false;
        }
        if (q && !(s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.email ?? "").toLowerCase().includes(q)))
          return false;
        return true;
      })
      .sort((x, y) => y.prediction.probability - x.prediction.probability);
    // `applied` re-runs the memo when the Predict button is pressed.
  }, [students, activeBranch, category, status, query, applied]);

  const n = filtered.length;
  const avgProb = n ? filtered.reduce((a, s) => a + s.prediction.probability, 0) / n : 0;
  const predictedPlaced = filtered.filter((s) => s.prediction.probability >= 50).length;
  const top = filtered[0];

  const importance = useMemo(() => {
    if (!n) return [];
    const feats = filtered[0].prediction.featureImportance.map((f) => f.feature);
    return feats.map((feature, i) => ({
      feature,
      impact:
        Math.round(
          (filtered.reduce((a, s) => a + s.prediction.featureImportance[i].weight * s.prediction.featureImportance[i].score, 0) /
            n) *
            10,
        ) / 10,
    }));
  }, [filtered, n]);

  const timeline = useMemo(() => {
    const steps = ["Now", "+2 weeks", "+4 weeks", "+6 weeks", "+8 weeks"];
    return steps.map((period, i) => ({
      period,
      projected: Math.round(Math.min(97, avgProb + i * 3.5)),
    }));
  }, [avgProb]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="hero-surface panel p-6">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold">
          <Sparkles className="size-5" /> AI Prediction Center
        </h1>
        <p className="text-sm font-medium opacity-90">Machine Learning Placement Prediction Dashboard</p>
        <p className="mt-1 text-sm opacity-80">
          Predict student placement readiness using Machine Learning and Business Analytics.
        </p>
      </section>

      {/* Filters */}
      <section className="panel no-print flex flex-wrap items-end gap-3 p-4">
        <Field label="Branch" value={activeBranch} onChange={setBranch} options={branches} />
        <Field
          label="Placement status"
          value={status}
          onChange={setStatus}
          options={["All", "Predicted Placed", "Predicted Not Placed"]}
        />
        <Field label="Performance category" value={category} onChange={setCategory} options={["All Categories", ...CATEGORIES]} />
        <label className="flex min-w-56 flex-[2] flex-col gap-1 text-xs font-medium text-muted-foreground">
          Search student
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, ID or email"
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <button
          onClick={() => setApplied((x) => x + 1)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Search className="size-4" /> Predict
        </button>
      </section>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card label="Total students" value={String(n)} />
        <Card label="Prediction completed" value={String(n)} sub="ML score computed for every row" />
        <Card label="Predicted placed" value={String(predictedPlaced)} tone="var(--success)" />
        <Card label="Predicted not placed" value={String(n - predictedPlaced)} tone="var(--destructive)" />
        <Card
          label="Highest probability"
          value={top ? `${Math.round(top.prediction.probability)}%` : "—"}
          sub={top ? top.name : undefined}
        />
        <Card label="Average prediction score" value={`${Math.round(avgProb)}%`} tone={bandColor(avgProb)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel flex flex-col items-center justify-center p-4">
          <h2 className="mb-2 self-start text-sm font-semibold">Cohort probability gauge</h2>
          <Gauge value={avgProb} label={`Average of ${n} students`} />
        </div>
        <div className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">Feature importance</h2>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={importance} layout="vertical" margin={{ left: 18 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" fontSize={11} />
              <YAxis type="category" dataKey="feature" width={78} fontSize={11} />
              <Tooltip />
              <Bar dataKey="impact" name="Weighted impact" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">Prediction timeline</h2>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="period" fontSize={11} />
              <YAxis domain={[0, 100]} fontSize={11} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="projected" stroke="var(--chart-2)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Table */}
      <section className="panel overflow-hidden">
        <h2 className="border-b border-border p-4 text-sm font-semibold">Student predictions ({n})</h2>
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="sticky top-0 bg-secondary text-xs">
              <tr>
                {["#", "Student", "Branch", "Overall score", "Prediction probability", "Category", "Status", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const placed = s.prediction.probability >= 50;
                return (
                  <tr key={s.id} className="border-t border-border transition hover:bg-secondary/50">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">
                      {s.name}
                      <span className="block text-xs text-muted-foreground">{s.id}</span>
                    </td>
                    <td className="px-3 py-2">{s.branch}</td>
                    <td className="px-3 py-2">{Math.round(s.prediction.overall)}%</td>
                    <td className="px-3 py-2 font-semibold" style={{ color: bandColor(s.prediction.probability) }}>
                      {Math.round(s.prediction.probability)}%
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${statusTone(
                        s.prediction.probability >= 85
                          ? "Excellent"
                          : s.prediction.probability >= 70
                            ? "Good"
                            : s.prediction.probability >= 50
                              ? "Average"
                              : "Needs Improvement",
                      )}`}
                      >
                        {s.prediction.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{placed ? "Predicted Placed" : "Predicted Not Placed"}</td>
                    <td className="px-3 py-2">
                      <Link
                        to="/report/$studentId"
                        params={{ studentId: s.id }}
                        className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!n && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                    No students match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Compare */}
      <section className="panel p-4">
        <h2 className="text-sm font-semibold">Compare students</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Benchmark two or three students side by side with grouped bar and radar overlays.
        </p>
        <Link
          to="/compare"
          className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Open compare tool
        </Link>
      </section>

      {/* Exports */}
      <section className="no-print flex flex-wrap gap-3">
        <button
          onClick={() => exportStudentsCsv(filtered, "ai-prediction-report.csv")}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Download className="size-4" /> Export CSV
        </button>
        <button
          onClick={() => exportStudentsExcel(filtered, "ai-prediction-report.xls")}
          className="flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium"
        >
          <FileSpreadsheet className="size-4" /> Export Excel
        </button>
        <button
          onClick={printReport}
          className="flex items-center gap-2 rounded-lg border border-input bg-card px-4 py-2 text-sm font-medium"
        >
          <Printer className="size-4" /> Export PDF / Print
        </button>
      </section>
    </div>
  );
}

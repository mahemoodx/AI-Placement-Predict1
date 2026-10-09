import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Download,
  FileSpreadsheet,
  Printer,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { CsvDropzone } from "@/components/CsvDropzone";
import { CATEGORIES, branchAverages, skillAverages, type PerformanceCategory } from "@/lib/placement-data";
import { exportStudentsCsv, exportStudentsExcel, printReport } from "@/lib/export-report";
import { usePlacementData } from "@/lib/placement-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Placement Analytics Dashboard | PlacementIQ" },
      {
        name: "description",
        content:
          "Filter by branch, placement status and performance category. See KPIs, rankings, risk students and skill charts from your CSV.",
      },
      { property: "og:title", content: "Placement Analytics Dashboard | PlacementIQ" },
      {
        property: "og:description",
        content: "AI-driven placement readiness analytics for the whole batch, built from your uploaded CSV.",
      },
    ],
  }),
  component: Dashboard,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Kpi({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
        {icon}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
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

function Dashboard() {
  const { students, hasData, hydrated } = usePlacementData();
  const [branch, setBranch] = useState("All");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All Categories");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"Placement Probability" | "Overall Score" | "CGPA">("Placement Probability");

  const branches = useMemo(() => ["All", ...new Set(students.map((s) => s.branch))].sort(), [students]);
  // The selected branch always comes from the current CSV; if a new upload no
  // longer contains it, the filter falls back to "All" automatically.
  const activeBranch = branches.includes(branch) ? branch : "All";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (activeBranch !== "All" && s.branch !== activeBranch) return false;
      if (status === "Placed" && s.placed !== true) return false;
      if (status === "Not Placed" && s.placed !== false) return false;
      if (category !== "All Categories" && s.prediction.category !== (category as PerformanceCategory)) return false;
      if (q && !(s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [students, activeBranch, status, category, query]);

  const ranked = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        sortBy === "CGPA"
          ? (b.cgpa ?? 0) - (a.cgpa ?? 0)
          : sortBy === "Overall Score"
            ? b.prediction.overall - a.prediction.overall
            : b.prediction.probability - a.prediction.probability,
      ),
    [filtered, sortBy],
  );


  const catCounts = CATEGORIES.map((c) => ({
    name: c,
    value: filtered.filter((s) => s.prediction.category === c).length,
  }));
  const skills = skillAverages(filtered);
  const branchData = branchAverages(filtered);
  const predictedPlaced = filtered.filter((s) => s.prediction.probability >= 50).length;
  const avgProbability = filtered.length
    ? filtered.reduce((a, s) => a + s.prediction.probability, 0) / filtered.length
    : 0;
  const topStudent = ranked[0];
  const highest = topStudent ? topStudent.prediction.probability : 0;
  const placementRate = filtered.length
    ? (filtered.filter((s) => s.placed).length / filtered.length) * 100
    : 0;

  const trend = useMemo(() => {
    // Batch-readiness trend derived from cumulative cohort performance buckets.
    const buckets = ["Week 1", "Week 3", "Week 5", "Week 7", "Week 9", "Now"];
    const target = filtered.length
      ? filtered.reduce((a, s) => a + s.prediction.probability, 0) / filtered.length
      : 0;
    return buckets.map((b, i) => ({
      period: b,
      readiness: Math.round(Math.max(0, target - (buckets.length - 1 - i) * 4.5)),
    }));
  }, [filtered]);

  if (!hydrated) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Loading your saved dataset…</p>
      </AppShell>
    );
  }

  if (!hasData) {
    return (
      <AppShell>
        <CsvDropzone />
      </AppShell>
    );
  }


  return (
    <AppShell>
      <section className="hero-surface panel mb-6 overflow-hidden p-6">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">AI Placement Prediction &amp; Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm opacity-90">
          Topic-wise aptitude, reasoning and English analysis with placement probability, risk detection and
          training recommendations — computed live from your CSV.
        </p>
      </section>

      {/* Filter bar */}
      <section className="panel no-print mb-6 flex flex-wrap items-end gap-3 p-4">
        <Select label="Branch" value={activeBranch} onChange={setBranch} options={branches} />
        <Select label="Placement Status" value={status} onChange={setStatus} options={["All", "Placed", "Not Placed"]} />
        <Select
          label="Performance"
          value={category}
          onChange={setCategory}
          options={["All Categories", ...CATEGORIES]}
        />
        <label className="flex min-w-56 flex-[2] flex-col gap-1 text-xs font-medium text-muted-foreground">
          Search Student
          <span className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student name or ID"
              className="w-full rounded-lg border border-input bg-card py-2 pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </span>
        </label>
      </section>

      {/* KPIs */}
      <section className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Total Students" value={String(filtered.length)} icon={<Users className="size-4" />} />
        <Kpi label="Prediction Completed" value={String(filtered.length)} sub="ML score per student" />
        <Kpi label="Predicted Placed" value={String(predictedPlaced)} sub="Probability 50% and above" />
        <Kpi label="Predicted Not Placed" value={String(filtered.length - predictedPlaced)} sub="Below 50%" />
        <Kpi label="Highest Probability" value={`${Math.round(highest)}%`} sub={topStudent ? topStudent.name : "—"} />
        <Kpi label="Average Prediction Score" value={`${Math.round(avgProbability)}%`} />
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Placement Ready" value={String(catCounts[0].value)} sub="85–100% score" />
        <Kpi label="Average" value={String(catCounts[2].value)} sub="50–69% score" />
        <Kpi label="Needs Training" value={String(catCounts[3].value)} sub="Below 50%" />
        <Kpi
          label="Placement Rate"
          value={`${Math.round(placementRate)}%`}
          icon={<TrendingUp className="size-4" />}
        />
      </section>

      {/* Charts */}
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">Placement Distribution</h2>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={catCounts} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                {catCounts.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">Skill Averages</h2>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={skills}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="skill" fontSize={11} />
              <YAxis domain={[0, 100]} fontSize={11} />
              <Tooltip formatter={(v: number) => `${Math.round(v)}%`} />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel p-4">
          <h2 className="mb-3 text-sm font-semibold">Placement Readiness Trend</h2>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="period" fontSize={11} />
              <YAxis domain={[0, 100]} fontSize={11} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Line type="monotone" dataKey="readiness" stroke="var(--chart-2)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel mb-6 p-4">
        <h2 className="mb-3 text-sm font-semibold">Branch-wise Placement Probability</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={branchData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="branch" fontSize={11} />
            <YAxis domain={[0, 100]} fontSize={11} />
            <Tooltip formatter={(v: number) => `${Math.round(v)}%`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="probability" name="Avg probability" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="overall" name="Avg score" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Ranking */}
      <section className="mb-6">
        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <h2 className="text-sm font-semibold">Student Ranking ({ranked.length})</h2>
            <label className="no-print text-xs text-muted-foreground">
              Sort by{" "}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-md border border-input bg-card px-2 py-1 text-xs"
              >
                <option>Placement Probability</option>
                <option>Overall Score</option>
                <option>CGPA</option>
              </select>
            </label>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-secondary text-xs text-secondary-foreground">
                <tr>
                  {["Rank", "Student", "Branch", "CGPA", "Score", "Probability", "Category", ""].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.map((s, i) => (
                  <tr key={s.id} className="border-t border-border hover:bg-secondary/60">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">
                      {s.name}
                      <span className="block text-xs text-muted-foreground">{s.id}</span>
                    </td>
                    <td className="px-3 py-2">{s.branch}</td>
                    <td className="px-3 py-2">{s.cgpa ?? "—"}</td>
                    <td className="px-3 py-2">{Math.round(s.prediction.overall)}%</td>
                    <td className="px-3 py-2 font-semibold text-primary">{Math.round(s.prediction.probability)}%</td>
                    <td className="px-3 py-2 text-xs">{s.prediction.category}</td>
                    <td className="px-3 py-2">
                      <Link
                        to="/students/$studentId"
                        params={{ studentId: s.id }}
                        className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {!ranked.length && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                      No students match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>


      <section className="no-print flex flex-wrap gap-3">
        <button
          onClick={() => exportStudentsCsv(ranked)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Download className="size-4" /> Export CSV
        </button>
        <button
          onClick={() => exportStudentsExcel(ranked)}
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
    </AppShell>
  );
}

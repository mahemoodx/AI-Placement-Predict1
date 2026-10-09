import { Link, createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { usePlacementData } from "@/lib/placement-store";

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { title: "Students | Placement Partner AI" },
      {
        name: "description",
        content: "Search students by ID, first name, last name or email and open topic-wise placement profiles.",
      },
      { property: "og:title", content: "Students | Placement Partner AI" },
      { property: "og:description", content: "Search and open student placement profiles." },
    ],
  }),
  component: StudentsPage,
});

function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "S";
}

function Avatar({ name }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
      {initials(name)}
    </span>
  );
}

function StudentsPage() {
  const { students } = usePlacementData();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? students.filter((s) => {
          const parts = String(s.name).trim().split(/\s+/);
          const first = (parts[0] ?? "").toLowerCase();
          const last = (parts.slice(1).join(" ") || "").toLowerCase();
          return (
            s.id.toLowerCase().includes(term) ||
            first.includes(term) ||
            last.includes(term) ||
            s.name.toLowerCase().includes(term) ||
            (s.email ?? "").toLowerCase().includes(term)
          );
        })
      : students;
    return [...list].sort((a, b) => b.prediction.probability - a.prediction.probability);
  }, [students, q]);

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold">Students</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Search by student ID, first name, last name or email to open a full profile.
      </p>

      <label className="panel mt-5 flex items-center gap-2 px-3 py-2">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by ID, first name, last name or email…"
          className="w-full bg-transparent py-1 text-sm outline-none"
        />
      </label>

      <p className="mt-2 text-xs text-muted-foreground">
        {rows.length} of {students.length} students
      </p>

      <div className="panel mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">CGPA</th>
              <th className="px-4 py-3">Placement probability</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-3">
                    <Avatar name={s.name} />
                    <span>
                      <span className="block font-medium">{s.name}</span>
                      <span className="block text-xs text-muted-foreground">{s.prediction.category}</span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2.5 font-medium">{s.id}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{s.email || "—"}</td>
                <td className="px-4 py-2.5">{s.branch}</td>
                <td className="px-4 py-2.5">{s.cgpa ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${Math.round(s.prediction.probability)}%` }}
                      />
                    </span>
                    <span className="font-semibold">{Math.round(s.prediction.probability)}%</span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    to="/students/$studentId"
                    params={{ studentId: s.id }}
                    className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No student matches “{q}”.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

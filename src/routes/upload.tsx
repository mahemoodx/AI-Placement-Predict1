import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileUp, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { usePlacementData } from "@/lib/placement-store";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Student CSV | PlacementIQ" },
      {
        name: "description",
        content: "Upload your student assessment CSV — aptitude, reasoning and English sub-topics are detected automatically.",
      },
      { property: "og:title", content: "Upload Student CSV | PlacementIQ" },
      { property: "og:description", content: "Map and analyse your placement dataset entirely in the browser." },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const { loadCsv, reset, columns, fileName, source, students } = usePlacementData();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handle = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    const res = await loadCsv(file);
    setBusy(false);
    if (res.ok) {
      toast.success(res.message);
      navigate({ to: "/" });
    } else {
      toast.error(res.message);
    }
  };

  const detected = students.length
    ? {
        aptitude: Object.keys(students[0].aptitude),
        reasoning: Object.keys(students[0].reasoning),
        english: Object.keys(students[0].english),
      }
    : { aptitude: [], reasoning: [], english: [] };

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold">Upload student dataset</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        The CSV is parsed in your browser. Aptitude, reasoning and English sub-topic columns are detected
        automatically; anything the app doesn't recognise is ignored so only the requested results are shown.
      </p>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handle(e.dataTransfer.files?.[0]);
        }}
        className="panel mt-6 flex flex-col items-center gap-3 border-dashed p-10 text-center"
      >
        <FileUp className="size-8 text-primary" />
        <p className="text-sm font-medium">Drag &amp; drop your CSV here</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => void handle(e.target.files?.[0])}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Parsing…" : "Choose CSV file"}
        </button>
        <button onClick={reset} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:underline">
          <RotateCcw className="size-3.5" /> Clear dataset
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="text-sm font-semibold">Current dataset</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {source === "csv" ? `${fileName}` : "No dataset loaded"} · {students.length} students ·{" "}
            {new Set(students.map((s) => s.branch)).size} branches
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <span className="font-medium">Aptitude sub-topics:</span>{" "}
              {detected.aptitude.join(", ") || "none detected"}
            </p>
            <p>
              <span className="font-medium">Reasoning sub-topics:</span>{" "}
              {detected.reasoning.join(", ") || "none detected"}
            </p>
            <p>
              <span className="font-medium">English sub-topics:</span>{" "}
              {detected.english.join(", ") || "none detected"}
            </p>
          </div>
        </div>
        <div className="panel p-4">
          <h2 className="text-sm font-semibold">Recognised columns</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Name, Student ID, Branch, CGPA, Coding, DSA, Placement Status, plus any aptitude / reasoning / English
            topic column (e.g. <code>Number System</code>, <code>Percentage</code>, <code>Blood Relations</code>,{" "}
            <code>Grammar</code>). Prefix columns with <code>apt_</code>, <code>rea_</code> or <code>eng_</code> to
            force a section.
          </p>
          {columns.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {columns.map((c) => (
                <span key={c} className="rounded-md bg-secondary px-2 py-1 text-xs">
                  {c}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

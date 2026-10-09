import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { usePlacementData } from "@/lib/placement-store";

const TEMPLATE =
  "Student ID,First Name,Last Name,Email ID,Branch,CGPA,Number System,Percentage,Blood Relations,Coding,DSA\n" +
  "1001,Asha,Rao,asha@example.com,CSE,8.4,82,64,71,78,69\n";

export function CsvDropzone({ title = "Drop your CSV here" }) {
  const { loadCsv } = usePlacementData();
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);

  const handle = async (file) => {
    if (!file) return;
    setBusy(true);
    const res = await loadCsv(file);
    setBusy(false);
    res.ok ? toast.success(res.message) : toast.error(res.message);
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "placement-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">College dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Cohort placement probability</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Upload your college's assessment CSV to see how many students fall into each placement readiness band.
            Nothing is calculated until your file is loaded.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <Download className="size-4" /> CSV template
        </button>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void handle(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`mt-8 flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-20 text-center transition-colors ${
          over ? "border-primary bg-secondary/60" : "border-border"
        }`}
      >
        <span className="hero-surface flex size-16 items-center justify-center rounded-2xl">
          <Upload className="size-7" />
        </span>
        <p className="font-display text-2xl font-bold">{title}</p>
        <p className="text-sm text-muted-foreground">
          or click to browse — expected columns: Name, Aptitude, Reasoning, English, Coding, DSA, CGPA
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => void handle(e.target.files?.[0])}
        />
        <span className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          {busy ? "Parsing…" : "Choose file"}
        </span>
      </div>
    </div>
  );
}

import Papa from "papaparse";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { mapRows, score, type Scored, type Student } from "./placement-data";

/* ---------------- context ------------------------------------------- */
/* In-memory only. No localStorage, sessionStorage, IndexedDB or backend.
   A refresh clears every student, prediction, chart and report.          */

interface Ctx {
  students: Scored[];
  hasData: boolean;
  hydrated: boolean;
  source: "none" | "csv";
  fileName: string | null;
  columns: string[];
  loadCsv: (file: File) => Promise<{ ok: boolean; message: string }>;
  reset: () => void;
}

const DataContext = createContext<Ctx | null>(null);

export function PlacementDataProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<Student[]>([]);
  const [source, setSource] = useState<"none" | "csv">("none");
  const [fileName, setFileName] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);

  const loadCsv = useCallback(
    (file: File) =>
      new Promise<{ ok: boolean; message: string }>((resolve) => {
        Papa.parse<Record<string, unknown>>(file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          complete: (res) => {
            const cols = (res.meta.fields ?? []).filter(Boolean) as string[];
            const students = mapRows(res.data);
            if (!students.length) {
              resolve({
                ok: false,
                message: "No student rows found. The CSV needs a name column plus score columns.",
              });
              return;
            }
            setRaw(students);
            setSource("csv");
            setFileName(file.name);
            setColumns(cols);
            resolve({ ok: true, message: `Loaded ${students.length} students from ${file.name}` });
          },
          error: (err) => resolve({ ok: false, message: err.message }),
        });
      }),
    [],
  );

  const reset = useCallback(() => {
    setRaw([]);
    setSource("none");
    setFileName(null);
    setColumns([]);
  }, []);

  const students = useMemo(() => score(raw), [raw]);

  const value = useMemo<Ctx>(
    () => ({
      students,
      hasData: students.length > 0,
      hydrated: true,
      source,
      fileName,
      columns,
      loadCsv,
      reset,
    }),
    [students, source, fileName, columns, loadCsv, reset],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function usePlacementData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("usePlacementData must be used inside PlacementDataProvider");
  return ctx;
}

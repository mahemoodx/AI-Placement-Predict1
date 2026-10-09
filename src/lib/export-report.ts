import type { Scored } from "./placement-data";

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function exportStudentsCsv(list: Scored[], fileName = "placement-report.csv") {
  const rows = list.map((s) => ({
    "Student ID": s.id,
    Name: s.name,
    Branch: s.branch,
    CGPA: s.cgpa ?? "",
    Aptitude: Math.round(s.prediction.aptitudeAvg),
    Reasoning: Math.round(s.prediction.reasoningAvg),
    English: Math.round(s.prediction.englishAvg),
    Coding: Math.round(s.prediction.coding),
    DSA: Math.round(s.prediction.dsa),
    "Overall Score": Math.round(s.prediction.overall),
    "Placement Probability": Math.round(s.prediction.probability),
    Category: s.prediction.category,
    Risk: s.prediction.risk,
    "Placement Status": s.placed === null ? "" : s.placed ? "Placed" : "Not Placed",
  }));
  const header = Object.keys(rows[0] ?? { Name: "" });
  const csv = [header.join(","), ...rows.map((r) => header.map((h) => esc((r as Record<string, unknown>)[h])).join(","))].join("\n");
  download(fileName, csv, "text/csv;charset=utf-8");
}

/** Excel opens this CSV variant natively; keeps the flow fully client-side. */
export function exportStudentsExcel(list: Scored[], fileName = "placement-report.xls") {
  const header = ["ID", "Name", "Branch", "CGPA", "Aptitude", "Reasoning", "English", "Coding", "DSA", "Score", "Probability", "Category", "Risk"];
  const body = list
    .map((s) =>
      `<tr>${[
        s.id,
        s.name,
        s.branch,
        s.cgpa ?? "",
        Math.round(s.prediction.aptitudeAvg),
        Math.round(s.prediction.reasoningAvg),
        Math.round(s.prediction.englishAvg),
        Math.round(s.prediction.coding),
        Math.round(s.prediction.dsa),
        Math.round(s.prediction.overall),
        Math.round(s.prediction.probability),
        s.prediction.category,
        s.prediction.risk,
      ]
        .map((c) => `<td>${c}</td>`)
        .join("")}</tr>`,
    )
    .join("");
  const html = `<table border="1"><tr>${header.map((h) => `<th>${h}</th>`).join("")}</tr>${body}</table>`;
  download(fileName, html, "application/vnd.ms-excel");
}

/** Browser print dialog → "Save as PDF" gives a clean PDF export. */
export function printReport() {
  window.print();
}

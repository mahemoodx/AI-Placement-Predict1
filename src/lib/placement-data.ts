// Core data model, CSV mapping, scoring and prediction engine.
// Everything here is pure front-end logic — no backend required.

export type TopicScores = Record<string, number>;

export interface Student {
  id: string;
  name: string;
  branch: string;
  email: string;
  cgpa: number | null;
  aptitude: TopicScores;
  reasoning: TopicScores;
  english: TopicScores;
  codingTopics: TopicScores;
  dsaTopics: TopicScores;
  overrides: Partial<Record<"aptitude" | "reasoning" | "english" | "coding" | "dsa", number>>;
  coding: number | null;
  dsa: number | null;
  csvProbability: number | null;
  placed: boolean | null;
}

export interface Prediction {
  aptitudeAvg: number;
  reasoningAvg: number;
  englishAvg: number;
  coding: number;
  dsa: number;
  cgpaPct: number;
  overall: number;
  probability: number;
  category: PerformanceCategory;
  strengths: { topic: string; section: string; score: number }[];
  weaknesses: { topic: string; section: string; score: number }[];
  featureImportance: { feature: string; weight: number; score: number }[];
  risk: "Low" | "Medium" | "High";
}

export type PerformanceCategory =
  | "Highly Placement Ready"
  | "Good Preparation"
  | "Average"
  | "Needs Training";

export const CATEGORIES: PerformanceCategory[] = [
  "Highly Placement Ready",
  "Good Preparation",
  "Average",
  "Needs Training",
];

export const SECTIONS = ["Aptitude", "Reasoning", "English", "Coding", "DSA"] as const;

/* ------------------------------------------------------------------ */
/* CSV column mapping                                                  */
/* ------------------------------------------------------------------ */

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

/** Explicit topic maps: normalised CSV header -> display label, in display order. */
const APT_TOPICS: [string, string][] = [
  ["number_system", "Number System"],
  ["percentages", "Percentages"],
  ["percentage", "Percentages"],
  ["profit_and_loss", "Profit & Loss"],
  ["profit_loss", "Profit & Loss"],
  ["time_and_work", "Time & Work"],
  ["time_speed_and_distance", "Time, Speed & Distance"],
  ["time_speed_distance", "Time, Speed & Distance"],
  ["ratio_and_proportion", "Ratio & Proportion"],
  ["averages", "Averages"],
  ["simple_compound_interest", "Simple & Compound Interest"],
  ["simple_and_compound_interest", "Simple & Compound Interest"],
  ["probability", "Probability"],
  ["permutation_and_combination", "Permutation & Combination"],
  ["mensuration", "Mensuration"],
  ["data_interpretation", "Data Interpretation"],
];

const REA_TOPICS: [string, string][] = [
  ["coding_decoding", "Coding-Decoding"],
  ["blood_relations", "Blood Relations"],
  ["direction_sense", "Direction Sense"],
  ["seating_arrangement", "Seating Arrangement"],
  ["number_series", "Number Series"],
  ["syllogisms", "Syllogisms"],
  ["syllogism", "Syllogisms"],
  ["logical_puzzles", "Logical Puzzles"],
  ["puzzles", "Logical Puzzles"],
  ["data_sufficiency", "Data Sufficiency"],
  ["analogy", "Analogy"],
];

const ENG_TOPICS: [string, string][] = [
  ["grammar", "Grammar"],
  ["vocabulary", "Vocabulary"],
  ["reading_comprehension", "Reading Comprehension"],
  ["sentence_correction", "Sentence Correction"],
  ["verbal_ability", "Verbal Ability"],
];

const COD_TOPICS: [string, string][] = [
  ["problem_solving", "Problem Solving"],
  ["programming_logic", "Programming Logic"],
  ["language_fundamentals_java_python_c", "Language Fundamentals"],
  ["language_fundamentals", "Language Fundamentals"],
  ["debugging", "Debugging"],
  ["algorithms", "Algorithms"],
  ["oop", "OOP"],
  ["oops", "OOP"],
];

const DSA_TOPICS: [string, string][] = [
  ["arrays", "Arrays"],
  ["strings", "Strings"],
  ["linked_lists", "Linked Lists"],
  ["stacks", "Stacks"],
  ["queues", "Queues"],
  ["trees", "Trees"],
  ["binary_search_trees", "Binary Search Trees"],
  ["graphs", "Graphs"],
  ["searching_algorithms", "Searching Algorithms"],
  ["sorting_algorithms", "Sorting Algorithms"],
  ["dynamic_programming", "Dynamic Programming"],
];

const idKeys = ["student_id", "roll_no", "rollno", "roll_number", "regno", "reg_no", "id", "sl_no", "s_no"];
const nameKeys = ["name", "student_name", "full_name", "student"];
const firstKeys = ["first_name", "firstname", "given_name"];
const lastKeys = ["last_name", "lastname", "surname"];
const emailKeys = ["email_id", "email", "mail", "student_email", "e_mail"];
const branchKeys = ["branch", "department", "dept", "stream"];
const cgpaKeys = ["cgpa", "gpa", "academic_score"];
const codingKeys = ["overall_coding_score", "coding_score", "coding", "programming"];
const dsaKeys = ["overall_dsa_score", "dsa_score", "dsa", "data_structures"];
const aptOverallKeys = ["overall_aptitude_score", "aptitude_score", "aptitude"];
const reaOverallKeys = ["overall_reasoning_score", "reasoning_score", "reasoning"];
const engOverallKeys = ["overall_english_score", "english_score", "english"];
const probKeys = ["placement_probability", "placement_probability_percent", "placement_probability_2", "probability_percent"];
const placedKeys = ["placed", "placement_status", "is_placed", "placement"];

function pick(row: Record<string, string>, keys: string[]): string | undefined {
  for (const k of keys) if (row[k] !== undefined && row[k] !== "") return row[k];
  return undefined;
}

function toNum(v: string | undefined): number | null {
  if (v === undefined) return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function collect(row: Record<string, string>, defs: [string, string][]): TopicScores {
  const out: TopicScores = {};
  defs.forEach(([key, label]) => {
    if (out[label] !== undefined) return;
    const n = toNum(row[key]);
    if (n !== null) out[label] = n;
  });
  return out;
}

export function prettyTopic(key: string) {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Convert raw CSV rows (already parsed by PapaParse) into Students. */
export function mapRows(rows: Record<string, unknown>[]): Student[] {
  const students: Student[] = [];
  rows.forEach((raw, i) => {
    const row: Record<string, string> = {};
    Object.entries(raw).forEach(([k, v]) => {
      if (k) row[norm(k)] = v === null || v === undefined ? "" : String(v).trim();
    });

    const first = pick(row, firstKeys) ?? "";
    const last = pick(row, lastKeys) ?? "";
    const name = (pick(row, nameKeys) ?? `${first} ${last}`.trim()).replace(/\s+/g, " ");
    if (!name) return;

    // "Probability" is an aptitude sub-topic here; the % column is separate.
    const probRaw =
      pick(row, ["placement_probability", "placement_probability_percent"]) ??
      Object.entries(row).find(([k]) => k.startsWith("placement_probability"))?.[1];

    const placedRaw = (pick(row, placedKeys) ?? "").toLowerCase();
    const placed = placedRaw
      ? ["1", "yes", "y", "true", "placed"].includes(placedRaw)
        ? true
        : ["0", "no", "n", "false", "not placed", "notplaced", "unplaced"].includes(placedRaw)
          ? false
          : null
      : null;

    const overrides: Student["overrides"] = {};
    const setOv = (k: keyof Student["overrides"], keys: string[]) => {
      const n = toNum(pick(row, keys));
      if (n !== null) overrides[k] = n;
    };
    setOv("aptitude", aptOverallKeys);
    setOv("reasoning", reaOverallKeys);
    setOv("english", engOverallKeys);

    const rollLike = pick(row, ["student_id", "roll_no", "rollno", "roll_number", "regno", "reg_no"]);
    const sl = pick(row, ["sl_no", "s_no", "id"]);

    students.push({
      id: rollLike ?? (sl ? `STU${String(sl).padStart(4, "0")}` : `STU${String(i + 1).padStart(4, "0")}`),
      name,
      branch: pick(row, branchKeys) ?? "Unknown",
      email: pick(row, emailKeys) ?? "",
      cgpa: toNum(pick(row, cgpaKeys)),
      aptitude: collect(row, APT_TOPICS),
      reasoning: collect(row, REA_TOPICS),
      english: collect(row, ENG_TOPICS),
      codingTopics: collect(row, COD_TOPICS),
      dsaTopics: collect(row, DSA_TOPICS),
      overrides,
      coding: toNum(pick(row, codingKeys)),
      dsa: toNum(pick(row, dsaKeys)),
      csvProbability: toNum(probRaw),
      placed,
    });
  });
  return students;
}

/* ------------------------------------------------------------------ */
/* Scoring + prediction (Random-Forest style weighted ensemble)        */
/* ------------------------------------------------------------------ */

export const avg = (o: TopicScores) => {
  const v = Object.values(o);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

/** Explainable-AI weights used for the prediction and the importance chart. */
export const WEIGHTS = {
  coding: 0.35,
  dsa: 0.25,
  cgpa: 0.18,
  aptitude: 0.12,
  reasoning: 0.07,
  english: 0.03,
};

export function categoryOf(probability: number): PerformanceCategory {
  return probability >= 85
    ? "Highly Placement Ready"
    : probability >= 70
      ? "Good Preparation"
      : probability >= 50
        ? "Average"
        : "Needs Training";
}

export function bandColor(v: number) {
  return v >= 85 ? "var(--chart-2)" : v >= 70 ? "var(--chart-1)" : v >= 50 ? "var(--chart-4)" : "var(--destructive)";
}

export function statusOf(score: number) {
  return score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Average" : "Needs Improvement";
}

export interface CoreScores {
  aptitude: number;
  reasoning: number;
  english: number;
  coding: number;
  dsa: number;
  cgpa: number | null;
}

/** Shared engine used by both CSV students and the manual AI Predictor page. */
export function predictFromScores(c: CoreScores) {
  const aptitudeAvg = clamp(c.aptitude);
  const reasoningAvg = clamp(c.reasoning);
  const englishAvg = clamp(c.english);
  const coding = clamp(c.coding);
  const dsa = clamp(c.dsa);
  const mean = (aptitudeAvg + reasoningAvg + englishAvg + coding + dsa) / 5;
  const cgpaPct = c.cgpa === null ? mean : clamp(c.cgpa <= 10 ? c.cgpa * 10 : c.cgpa);

  const overall =
    coding * WEIGHTS.coding +
    dsa * WEIGHTS.dsa +
    cgpaPct * WEIGHTS.cgpa +
    aptitudeAvg * WEIGHTS.aptitude +
    reasoningAvg * WEIGHTS.reasoning +
    englishAvg * WEIGHTS.english;

  const probability = clamp(100 / (1 + Math.exp(-(overall - 58) / 9)));

  const featureImportance = [
    { feature: "Coding", weight: WEIGHTS.coding, score: coding },
    { feature: "DSA", weight: WEIGHTS.dsa, score: dsa },
    { feature: "CGPA", weight: WEIGHTS.cgpa, score: cgpaPct },
    { feature: "Aptitude", weight: WEIGHTS.aptitude, score: aptitudeAvg },
    { feature: "Reasoning", weight: WEIGHTS.reasoning, score: reasoningAvg },
    { feature: "English", weight: WEIGHTS.english, score: englishAvg },
  ];

  return { aptitudeAvg, reasoningAvg, englishAvg, coding, dsa, cgpaPct, overall, probability, featureImportance };
}

/** Every sub-topic of a student, flattened with its section. */
export function allTopics(s: Student) {
  const rows: { topic: string; section: string; score: number }[] = [];
  const add = (o: TopicScores, section: string) =>
    Object.entries(o).forEach(([topic, score]) => rows.push({ topic, section, score }));
  add(s.aptitude, "Aptitude");
  add(s.reasoning, "Reasoning");
  add(s.english, "English");
  add(s.codingTopics, "Coding");
  add(s.dsaTopics, "DSA");
  return rows;
}

export function predict(s: Student): Prediction {
  const base = predictFromScores({
    aptitude: s.overrides.aptitude ?? avg(s.aptitude),
    reasoning: s.overrides.reasoning ?? avg(s.reasoning),
    english: s.overrides.english ?? avg(s.english),
    coding: s.coding ?? avg(s.codingTopics),
    dsa: s.dsa ?? avg(s.dsaTopics),
    cgpa: s.cgpa,
  });

  // Trust the probability column when the dataset provides one.
  const probability = s.csvProbability === null ? base.probability : clamp(s.csvProbability);
  const category = categoryOf(probability);

  const sorted = [...allTopics(s)].sort((a, b) => b.score - a.score);

  const risk: Prediction["risk"] = probability < 50 ? "High" : probability < 70 ? "Medium" : "Low";

  return {
    ...base,
    probability,
    category,
    strengths: sorted.slice(0, 6),
    weaknesses: sorted.slice(-6).reverse(),
    featureImportance: base.featureImportance,
    risk,
  };
}

/* ------------------------------------------------------------------ */
/* Company eligibility                                                 */
/* ------------------------------------------------------------------ */

export interface Company {
  name: string;
  cgpa: number;
  coding: number;
  english: number;
  reasoning: number;
  type: "Service" | "Product";
}

export const COMPANIES: Company[] = [
  { name: "TCS", cgpa: 7.0, coding: 60, english: 65, reasoning: 60, type: "Service" },
  { name: "Infosys", cgpa: 6.5, coding: 60, english: 65, reasoning: 60, type: "Service" },
  { name: "Wipro", cgpa: 6.0, coding: 55, english: 60, reasoning: 55, type: "Service" },
  { name: "Accenture", cgpa: 6.0, coding: 58, english: 68, reasoning: 60, type: "Service" },
  { name: "Cognizant", cgpa: 6.5, coding: 60, english: 65, reasoning: 62, type: "Service" },
  { name: "Capgemini", cgpa: 6.0, coding: 58, english: 62, reasoning: 58, type: "Service" },
  { name: "Amazon", cgpa: 7.0, coding: 85, english: 70, reasoning: 80, type: "Product" },
  { name: "Microsoft", cgpa: 7.5, coding: 88, english: 75, reasoning: 82, type: "Product" },
  { name: "Google", cgpa: 8.0, coding: 90, english: 78, reasoning: 85, type: "Product" },
];

export function eligibility(s: Student, p: Prediction) {
  const cgpa = s.cgpa ?? p.cgpaPct / 10;
  return COMPANIES.map((c) => {
    const checks = [
      { label: "CGPA", need: c.cgpa, have: Number(cgpa.toFixed(2)) },
      { label: "Coding", need: c.coding, have: Math.round(p.coding) },
      { label: "English", need: c.english, have: Math.round(p.englishAvg) },
      { label: "Reasoning", need: c.reasoning, have: Math.round(p.reasoningAvg) },
    ];
    return { company: c, checks, eligible: checks.every((k) => k.have >= k.need) };
  });
}

/* ------------------------------------------------------------------ */
/* Aggregations                                                        */
/* ------------------------------------------------------------------ */

export interface Scored extends Student {
  prediction: Prediction;
}

export const score = (list: Student[]): Scored[] =>
  list.map((s) => ({ ...s, prediction: predict(s) }));

export function branchAverages(list: Scored[]) {
  const map = new Map<string, { branch: string; overall: number; probability: number; n: number; placed: number }>();
  list.forEach((s) => {
    const e = map.get(s.branch) ?? { branch: s.branch, overall: 0, probability: 0, n: 0, placed: 0 };
    e.overall += s.prediction.overall;
    e.probability += s.prediction.probability;
    e.placed += s.placed ? 1 : 0;
    e.n += 1;
    map.set(s.branch, e);
  });
  return [...map.values()]
    .map((e) => ({
      branch: e.branch,
      overall: e.overall / e.n,
      probability: e.probability / e.n,
      students: e.n,
      placementRate: (e.placed / e.n) * 100,
    }))
    .sort((a, b) => b.probability - a.probability);
}

export function skillAverages(list: Scored[]) {
  if (!list.length) return [];
  const keys: (keyof Prediction)[] = ["aptitudeAvg", "reasoningAvg", "englishAvg", "coding", "dsa", "cgpaPct"];
  const labels = ["Aptitude", "Reasoning", "English", "Coding", "DSA", "CGPA"];
  return keys.map((k, i) => ({
    skill: labels[i],
    value: list.reduce((a, s) => a + (s.prediction[k] as number), 0) / list.length,
  }));
}

export function topicAverages(list: Scored[], section: "aptitude" | "reasoning" | "english") {
  const totals = new Map<string, { sum: number; n: number }>();
  list.forEach((s) =>
    Object.entries(s[section]).forEach(([t, v]) => {
      const e = totals.get(t) ?? { sum: 0, n: 0 };
      e.sum += v;
      e.n += 1;
      totals.set(t, e);
    }),
  );
  return [...totals.entries()]
    .map(([topic, e]) => ({ topic, value: e.sum / e.n }))
    .sort((a, b) => b.value - a.value);
}

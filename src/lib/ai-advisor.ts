import {
  avg,
  branchAverages,
  eligibility,
  prettyTopic,
  type Prediction,
  type Scored,
} from "./placement-data";

export type Mode = "basic" | "advanced" | "executive";

const pct = (n: number) => `${Math.round(n)}%`;
const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

const NO_DATA =
  "This information is not available in the uploaded dataset or cannot be inferred reliably.";

function topicList(s: Scored, section: "aptitude" | "reasoning" | "english") {
  return Object.entries(s[section])
    .map(([t, v]) => `• ${prettyTopic(t)}: ${pct(v)}`)
    .join("\n");
}

function trainingPlan(s: Scored) {
  const weak = s.prediction.weaknesses.map((w) => w.topic);
  return [
    "Recommended Training Plan",
    "Week 1–2  Fundamentals + " + (weak[0] ?? "Aptitude basics"),
    "Week 3–4  " + (weak[1] ?? "Arrays, Strings, Sorting"),
    "Week 5–6  " + (weak[2] ?? "Trees, Graphs, Dynamic Programming"),
    "Week 7    Mock coding contest + timed aptitude tests",
    "Week 8    HR interview + communication workshop",
    "",
    `Current probability: ${pct(s.prediction.probability)}`,
    `Expected after training: ${pct(Math.min(97, s.prediction.probability + 15))}`,
  ].join("\n");
}

/** Rule-based career assistant for one student. */
export function answerStudent(question: string, s: Scored, cohort: Scored[], mode: Mode): string {
  const q = question.toLowerCase();
  const p = s.prediction;
  const branch = cohort.filter((c) => c.branch === s.branch);
  const branchAvg = branch.length
    ? branch.reduce((a, c) => a + c.prediction.overall, 0) / branch.length
    : p.overall;
  const collegeAvg = cohort.length
    ? cohort.reduce((a, c) => a + c.prediction.overall, 0) / cohort.length
    : p.overall;

  if (mode === "executive") {
    return [
      "Executive Summary",
      "",
      `Student            ${s.name} (${s.id}, ${s.branch})`,
      `Overall Performance ${pct(p.overall)} — ${p.category}`,
      `Placement Probability ${pct(p.probability)}`,
      `Risk Level          ${p.risk}`,
      "",
      "Strong Skills",
      ...p.strengths.slice(0, 3).map((x) => `  ${x.topic} (${pct(x.score)})`),
      "",
      "Needs Improvement",
      ...p.weaknesses.slice(0, 3).map((x) => `  ${x.topic} (${pct(x.score)})`),
      "",
      `Recommended Action  ${
        p.risk === "High"
          ? "Enroll in intensive coding + aptitude training immediately"
          : p.risk === "Medium"
            ? "Targeted topic training and weekly assessments"
            : "Schedule mock interview and company shortlisting"
      }`,
    ].join("\n");
  }

  const basic = mode === "basic";

  // --- eligibility -------------------------------------------------
  if (has(q, "eligib", "tcs", "infosys", "accenture", "cognizant", "wipro", "capgemini", "company", "companies", "product-based", "product based")) {
    const rows = eligibility(s, p);
    const named = rows.find((r) => q.includes(r.company.name.toLowerCase()));
    if (named) {
      if (basic)
        return `${named.eligible ? "Yes." : "Not yet."} ${s.name} ${named.eligible ? "meets" : "does not meet"} the minimum ${named.company.name} criteria.`;
      return [
        `Company Eligibility Analysis — ${named.company.name}`,
        ...named.checks.map(
          (c) => `${c.label}: required ${c.need}, student ${c.have} → ${c.have >= c.need ? "PASS" : "FAIL"}`,
        ),
        "",
        `Final Result: ${named.eligible ? "Eligible" : "Not Eligible"}`,
      ].join("\n");
    }
    const ok = rows.filter((r) => r.eligible).map((r) => r.company.name);
    if (basic)
      return ok.length
        ? `${s.name} is currently eligible for ${ok.join(", ")}.`
        : `${s.name} does not clear any of the tracked company cut-offs yet.`;
    return [
      "Eligible Companies",
      ...(ok.length ? ok.map((n) => `✔ ${n}`) : ["None yet"]),
      "",
      "Preparation Needed",
      ...rows.filter((r) => !r.eligible).map((r) => `• ${r.company.name} — ${r.checks.filter((c) => c.have < c.need).map((c) => `${c.label} ${c.have}/${c.need}`).join(", ")}`),
    ].join("\n");
  }

  // --- weaknesses / improvement ------------------------------------
  if (has(q, "weak", "improve", "improvement", "biggest weakness", "needs")) {
    if (basic)
      return `${s.name} should focus on ${p.weaknesses.slice(0, 2).map((w) => w.topic).join(" and ")} — currently ${p.weaknesses.map((w) => pct(w.score)).slice(0, 2).join(" and ")}.`;
    return [
      "Weak Skill Analysis",
      ...p.weaknesses.map(
        (w) =>
          `${w.topic} (${w.section})\n  Current ${pct(w.score)}  →  Target ${pct(Math.min(85, w.score + 22))}  (needs +${Math.round(Math.min(85, w.score + 22) - w.score)}%)`,
      ),
      "",
      "Recommendation",
      "• Daily timed practice on the two weakest topics",
      "• Weekly full-length mock assessment",
      "• Communication workshop if English < 70%",
      "",
      `Expected probability after improvement: ${pct(Math.min(97, p.probability + 12))}`,
    ].join("\n");
  }

  // --- strengths ---------------------------------------------------
  if (has(q, "strength", "strong", "best subject", "good at")) {
    if (basic) return `Strongest areas: ${p.strengths.slice(0, 3).map((x) => x.topic).join(", ")}.`;
    return [
      "Top Strengths",
      ...p.strengths.map((x) => `✔ ${x.topic} (${x.section}) — ${pct(x.score)}`),
      "",
      `AI Conclusion: ${s.name} performs best in ${p.strengths[0]?.topic ?? "core assessments"} and should leverage this in interviews.`,
    ].join("\n");
  }

  // --- training / plan ---------------------------------------------
  if (has(q, "training", "plan", "roadmap", "30-day", "30 day", "60", "study", "practice")) {
    if (basic)
      return `Recommended: focused training in ${p.weaknesses.slice(0, 2).map((w) => w.topic).join(", ")}, plus daily coding and weekly mock tests.`;
    return trainingPlan(s);
  }

  // --- comparison / rank -------------------------------------------
  if (has(q, "compare", "average", "rank", "percentile", "top performer")) {
    const sortedBranch = [...branch].sort((a, b) => b.prediction.overall - a.prediction.overall);
    const rank = sortedBranch.findIndex((x) => x.id === s.id) + 1;
    const percentile = branch.length ? Math.round(((branch.length - rank) / branch.length) * 100) : 0;
    const top = sortedBranch[0];
    if (basic)
      return `${s.name} scores ${pct(p.overall)} vs a ${s.branch} average of ${pct(branchAvg)} — rank ${rank} of ${branch.length}.`;
    return [
      "Comparison",
      `Student overall      ${pct(p.overall)}`,
      `${s.branch} average${" ".repeat(Math.max(1, 12 - s.branch.length))}${pct(branchAvg)}`,
      `College average      ${pct(collegeAvg)}`,
      `Branch rank          ${rank} / ${branch.length} (${percentile}th percentile)`,
      top ? `Top performer        ${top.name} — ${pct(top.prediction.overall)}` : "",
      "",
      p.overall >= collegeAvg
        ? "This student is above the college average."
        : "This student is below the college average and needs structured training.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  // --- interview ready ---------------------------------------------
  if (has(q, "interview", "hr ", "mock")) {
    const ready = p.coding >= 70 && p.dsa >= 70;
    if (basic)
      return ready
        ? `${s.name} is ready for technical interviews; polish HR and communication.`
        : `Not yet — coding (${pct(p.coding)}) and DSA (${pct(p.dsa)}) need to reach 70% before technical rounds.`;
    return [
      "Interview Readiness",
      `Technical rounds: ${ready ? "Ready" : "Not ready"} (Coding ${pct(p.coding)}, DSA ${pct(p.dsa)})`,
      `HR rounds: ${p.englishAvg >= 70 ? "Ready" : "Needs communication practice"} (English ${pct(p.englishAvg)})`,
      "",
      "Practice list",
      "• Arrays, strings, hashing — 20 problems",
      "• Trees, graphs, DP — 20 problems",
      "• 5 mock interviews with feedback",
      "• Tell-me-about-yourself and project deep-dive drills",
    ].join("\n");
  }

  // --- role fit -----------------------------------------------------
  if (has(q, "role", "career", "suited", "job", "engineer", "analyst")) {
    const role =
      p.dsa >= 75 && p.coding >= 75
        ? "Software Engineer (Backend)"
        : p.aptitudeAvg >= 75 && p.reasoningAvg >= 70
          ? "Data / Business Analyst"
          : p.englishAvg >= 75
            ? "Support & Client-facing Engineer"
            : "Trainee Software Engineer after training";
    if (basic) return `Best-fit role: ${role}.`;
    return [
      `Best-fit role: ${role}`,
      "",
      "Reasoning",
      `• Coding ${pct(p.coding)} / DSA ${pct(p.dsa)} — problem solving strength`,
      `• Aptitude ${pct(p.aptitudeAvg)} / Reasoning ${pct(p.reasoningAvg)} — analytical strength`,
      `• English ${pct(p.englishAvg)} — communication strength`,
    ].join("\n");
  }

  // --- topic-wise ----------------------------------------------------
  if (has(q, "aptitude", "reasoning", "english", "topic")) {
    const section = q.includes("reasoning") ? "reasoning" : q.includes("english") ? "english" : "aptitude";
    const list = topicList(s, section);
    if (!list) return NO_DATA;
    const label = section[0].toUpperCase() + section.slice(1);
    if (basic) return `${label} average is ${pct(avg(s[section]))}.`;
    return `${label} — topic-wise performance\n${list}\n\nSection average: ${pct(avg(s[section]))}`;
  }

  // --- default: prediction explanation --------------------------------
  if (basic)
    return `${s.name} scores ${pct(p.overall)} overall with a ${pct(p.probability)} placement probability (${p.category}). Strongest: ${p.strengths[0]?.topic ?? "n/a"}; weakest: ${p.weaknesses[0]?.topic ?? "n/a"}.`;
  return explainAdvanced(s, p);
}

function explainAdvanced(s: Scored, p: Prediction) {
  return [
    "Prediction Explanation",
    "",
    "The ensemble model analysed CGPA, Aptitude, Reasoning, English, Coding and DSA.",
    "",
    "Feature contributions",
    ...p.featureImportance
      .slice()
      .sort((a, b) => b.weight * b.score - a.weight * a.score)
      .map((f) => `• ${f.feature}: score ${pct(f.score)} × weight ${f.weight.toFixed(2)}`),
    "",
    "Strengths",
    ...p.strengths.slice(0, 3).map((x) => `✔ ${x.topic} — ${pct(x.score)}`),
    "",
    "Weaknesses",
    ...p.weaknesses.slice(0, 3).map((x) => `• ${x.topic} — ${pct(x.score)}`),
    "",
    `Final Prediction: ${p.category}`,
    `Placement Probability: ${pct(p.probability)}`,
    `Risk Level: ${p.risk}`,
  ].join("\n");
}

/* -------------------- college-level assistant ---------------------- */

export function answerOfficer(question: string, cohort: Scored[], mode: Mode): string {
  const q = question.toLowerCase();
  if (!cohort.length) return NO_DATA;
  const branches = branchAverages(cohort);
  const overallAvg = cohort.reduce((a, s) => a + s.prediction.overall, 0) / cohort.length;
  const ready = cohort.filter((s) => s.prediction.category === "Highly Placement Ready").length;
  const risk = cohort.filter((s) => s.prediction.risk === "High");

  if (has(q, "highest", "best branch", "which branch")) {
    const top = branches[0];
    if (mode === "basic")
      return `${top.branch} leads with an average placement probability of ${pct(top.probability)} across ${top.students} students.`;
    return [
      "Branch ranking by placement probability",
      ...branches.map((b, i) => `${i + 1}. ${b.branch} — ${pct(b.probability)} probability, ${pct(b.overall)} score, ${b.students} students`),
    ].join("\n");
  }

  if (has(q, "dsa training", "how many students need", "need training", "training")) {
    const needDsa = cohort.filter((s) => s.prediction.dsa < 60).length;
    const needApt = cohort.filter((s) => s.prediction.aptitudeAvg < 60).length;
    const needEng = cohort.filter((s) => s.prediction.englishAvg < 60).length;
    if (mode === "basic") return `${needDsa} students need DSA training, ${needApt} need aptitude support and ${needEng} need English training.`;
    return [
      "Training demand across the batch",
      `DSA below 60%:       ${needDsa} students`,
      `Coding below 60%:    ${cohort.filter((s) => s.prediction.coding < 60).length} students`,
      `Aptitude below 60%:  ${needApt} students`,
      `Reasoning below 60%: ${cohort.filter((s) => s.prediction.reasoningAvg < 60).length} students`,
      `English below 60%:   ${needEng} students`,
    ].join("\n");
  }

  if (has(q, "priority", "20 students", "which students")) {
    const list = [...risk].sort((a, b) => a.prediction.probability - b.prediction.probability).slice(0, 20);
    return [
      "Priority training list (lowest placement probability)",
      ...list.map((s, i) => `${i + 1}. ${s.name} (${s.branch}) — ${pct(s.prediction.probability)}, weakest: ${s.prediction.weaknesses[0]?.topic ?? "n/a"}`),
    ].join("\n");
  }

  if (has(q, "compare")) {
    const found = branches.filter((b) => q.includes(b.branch.toLowerCase()));
    const pair = found.length >= 2 ? found.slice(0, 2) : branches.slice(0, 2);
    return [
      `Comparison — ${pair[0].branch} vs ${pair[1].branch}`,
      `Students:    ${pair[0].students} vs ${pair[1].students}`,
      `Avg score:   ${pct(pair[0].overall)} vs ${pct(pair[1].overall)}`,
      `Probability: ${pct(pair[0].probability)} vs ${pct(pair[1].probability)}`,
      `Placed rate: ${pct(pair[0].placementRate)} vs ${pct(pair[1].placementRate)}`,
    ].join("\n");
  }

  if (has(q, "skill gap", "gaps", "top 5")) {
    const gaps = [
      { skill: "Coding", value: cohort.reduce((a, s) => a + s.prediction.coding, 0) / cohort.length },
      { skill: "DSA", value: cohort.reduce((a, s) => a + s.prediction.dsa, 0) / cohort.length },
      { skill: "Aptitude", value: cohort.reduce((a, s) => a + s.prediction.aptitudeAvg, 0) / cohort.length },
      { skill: "Reasoning", value: cohort.reduce((a, s) => a + s.prediction.reasoningAvg, 0) / cohort.length },
      { skill: "English", value: cohort.reduce((a, s) => a + s.prediction.englishAvg, 0) / cohort.length },
    ].sort((a, b) => a.value - b.value);
    return ["Top skill gaps across the college", ...gaps.slice(0, 5).map((g, i) => `${i + 1}. ${g.skill} — batch average ${pct(g.value)}`)].join("\n");
  }

  if (has(q, "placement rate", "predict", "strategy", "overall")) {
    const expected = cohort.reduce((a, s) => a + s.prediction.probability, 0) / cohort.length;
    if (mode === "basic") return `Predicted batch placement rate: ${pct(expected)} (${ready} students already highly placement ready).`;
    return [
      "Batch placement outlook",
      `Students analysed:        ${cohort.length}`,
      `Average performance:      ${pct(overallAvg)}`,
      `Predicted placement rate: ${pct(expected)}`,
      `Highly placement ready:   ${ready}`,
      `High-risk students:       ${risk.length}`,
      "",
      "Recommended strategy",
      "1. Weekly coding + DSA bootcamp for high-risk students",
      "2. Branch-wise aptitude drills for branches below batch average",
      "3. Communication workshops for students with English < 65%",
      "4. Mock drives aligned to service-company cut-offs",
    ].join("\n");
  }

  return [
    "Batch snapshot",
    `Students: ${cohort.length}`,
    `Average performance: ${pct(overallAvg)}`,
    `Highly placement ready: ${ready}`,
    `High risk: ${risk.length}`,
    `Best branch: ${branches[0].branch} (${pct(branches[0].probability)})`,
  ].join("\n");
}

export const STUDENT_SUGGESTIONS = [
  "Why is this student predicted to get placed?",
  "What skills should this student improve?",
  "What training do you recommend?",
  "Is this student eligible for TCS?",
  "What are this student's strengths?",
  "Compare this student with the branch average",
  "Is this student ready for technical interviews?",
  "Which role suits this student?",
];

export const OFFICER_SUGGESTIONS = [
  "Which branch has the highest placement probability?",
  "How many students need DSA training?",
  "Which 20 students should receive priority training?",
  "What are the top 5 skill gaps across the college?",
  "Predict the overall placement rate",
];

/** Suggestions built from the branches present in the uploaded CSV. */
export function officerSuggestions(cohort: Scored[]): string[] {
  const branches = [...new Set(cohort.map((s) => s.branch).filter(Boolean))];
  const compare =
    branches.length >= 2 ? [`Compare ${branches[0]} and ${branches[1]}`] : branches.length === 1 ? [`How is ${branches[0]} performing?`] : [];
  return [OFFICER_SUGGESTIONS[0], OFFICER_SUGGESTIONS[1], OFFICER_SUGGESTIONS[2], ...compare, OFFICER_SUGGESTIONS[3], OFFICER_SUGGESTIONS[4]];
}

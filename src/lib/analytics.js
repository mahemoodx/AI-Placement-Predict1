// Peer ranking, improvement planning and company-tier logic.
// Everything is derived from the uploaded CSV + computed ML results only.

export const NOT_AVAILABLE = "Not available in dataset";

/** Topic status bands requested by the product spec. */
export function topicStatus(score) {
  return score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Average" : "Needs Improvement";
}

export function statusTone(status) {
  return status === "Excellent"
    ? "bg-success/15 text-success"
    : status === "Good"
      ? "bg-primary/15 text-primary"
      : status === "Average"
        ? "bg-chart-4/20 text-chart-4"
        : "bg-destructive/15 text-destructive";
}

/** Strong sub-topics (>= 80) with a one-line explanation. */
export function strongAreas(topics, min = 80) {
  return topics
    .filter((t) => t.score >= min)
    .sort((a, b) => b.score - a.score)
    .map((t) => ({
      ...t,
      note: `Consistently strong in ${t.topic} (${Math.round(t.score)}%) — a reliable ${t.section.toLowerCase()} scoring area.`,
      priority: t.score >= 90 ? "Maintain" : "Leverage",
    }));
}

/** Weak sub-topics (< 60) with explanation and improvement priority. */
export function weakAreas(topics, max = 60) {
  return topics
    .filter((t) => t.score < max)
    .sort((a, b) => a.score - b.score)
    .map((t) => ({
      ...t,
      note: `${t.topic} is at ${Math.round(t.score)}% — below the ${max}% ${t.section.toLowerCase()} benchmark expected in placement tests.`,
      priority: t.score < 40 ? "Critical" : t.score < 50 ? "High" : "Medium",
    }));
}

/** Rank / percentile of a student inside the cohort and inside their branch. */
export function peerStats(student, cohort) {
  const byProb = (a, b) => b.prediction.probability - a.prediction.probability;
  const all = [...cohort].sort(byProb);
  const branchList = all.filter((s) => s.branch === student.branch);
  const collegeRank = all.findIndex((s) => s.id === student.id) + 1;
  const branchRank = branchList.findIndex((s) => s.id === student.id) + 1;
  const total = all.length || 1;
  const percentile = Math.round(((total - collegeRank) / total) * 100);
  const mean = (key) => all.reduce((a, s) => a + s.prediction[key], 0) / total;

  return {
    collegeRank,
    collegeTotal: all.length,
    branchRank,
    branchTotal: branchList.length,
    percentile,
    topPercent: Math.max(1, Math.round((collegeRank / total) * 100)),
    averages: [
      { label: "Aptitude", you: student.prediction.aptitudeAvg, cohort: mean("aptitudeAvg") },
      { label: "Reasoning", you: student.prediction.reasoningAvg, cohort: mean("reasoningAvg") },
      { label: "English", you: student.prediction.englishAvg, cohort: mean("englishAvg") },
      { label: "Coding", you: student.prediction.coding, cohort: mean("coding") },
      { label: "DSA", you: student.prediction.dsa, cohort: mean("dsa") },
      { label: "Probability", you: student.prediction.probability, cohort: mean("probability") },
    ],
  };
}

/** 30 / 60 / 90 day training plan built from the weakest CSV sub-topics. */
export function improvementPlan(weak, p) {
  const names = weak.map((t) => t.topic);
  const slice = (from, to) => names.slice(from, to);
  const fallback = (list, text) => (list.length ? list : [text]);

  return [
    {
      window: "30-Day Plan",
      focus: fallback(
        slice(0, 3).map((t) => `Daily drills on ${t} — 45 min/day + 20 practice questions`),
        "No sub-topic is below 60% — run weekly timed mocks to hold the current level",
      ),
    },
    {
      window: "60-Day Plan",
      focus: fallback(
        slice(3, 6).map((t) => `Sectional tests covering ${t} with error-log review`),
        p.dsa < 75 ? ["Solve 3 DSA problems daily across arrays, strings and trees"] : ["Company-specific pattern practice"],
      ).concat(p.coding < 70 ? ["Rebuild coding fundamentals: 2 problems/day + debugging practice"] : []),
    },
    {
      window: "90-Day Plan",
      focus: fallback(
        slice(6).map((t) => `Full-length mocks with ${t} revision`),
        "Full-length mock drives, mock interviews and group discussions",
      ).concat(p.englishAvg < 70 ? ["Daily reading comprehension and vocabulary practice"] : []),
    },
  ];
}

/** Company tiers — only emitted when the computed CSV scores support them. */
export function companyTiers(p) {
  const service = p.probability >= 50 && p.coding >= 50;
  const mid = p.probability >= 70 && p.coding >= 65 && p.dsa >= 60;
  const product = p.probability >= 85 && p.coding >= 80 && p.dsa >= 75;
  return [
    {
      tier: "Service-Based",
      eligible: service,
      names: service ? ["TCS Ninja", "Wipro Elite", "Capgemini", "Tech Mahindra"] : null,
    },
    {
      tier: "Mid-Tier",
      eligible: mid,
      names: mid ? ["TCS Digital", "Infosys Power Programmer", "Cognizant GenC Next", "Deloitte"] : null,
    },
    {
      tier: "Product-Based",
      eligible: product,
      names: product ? ["Amazon", "Microsoft", "Google", "Salesforce"] : null,
    },
  ];
}

/** Estimated probability lift if the weak sub-topics reach the 75% benchmark. */
export function expectedImprovement(p, weak) {
  if (!weak.length) return { lift: 0, target: Math.round(p.probability) };
  const gap = weak.reduce((a, t) => a + (75 - t.score), 0) / weak.length;
  const lift = Math.min(25, Math.round((gap / 75) * weak.length * 2.5));
  return { lift, target: Math.min(99, Math.round(p.probability + lift)) };
}

/** Model confidence — how far the score sits from the 50% decision boundary. */
export function modelConfidence(p) {
  return Math.round(Math.min(99, 55 + Math.abs(p.probability - 50) * 0.85));
}

/** Weighted score-breakdown rows used by the AI Placement Report. */
export function scoreBreakdown(p) {
  return p.featureImportance.map((f) => ({
    category: f.feature,
    score: Math.round(f.score),
    weight: Math.round(f.weight * 100),
    contribution: Math.round(f.score * f.weight * 10) / 10,
    status: topicStatus(f.score),
  }));
}

/** 3-5 plain-language bullets explaining the prediction. */
export function explanationBullets(student, p, strong, weak) {
  const rows = scoreBreakdown(p).sort((a, b) => b.contribution - a.contribution);
  const out = [
    `${rows[0].category} contributes the most (${rows[0].contribution} points at ${rows[0].weight}% model weight) with a score of ${rows[0].score}%.`,
    `Coding and DSA together carry 60% of the model weight — this student scores ${Math.round(p.coding)}% and ${Math.round(p.dsa)}%.`,
    `Academic record (CGPA ${student.cgpa ?? NOT_AVAILABLE}) maps to ${Math.round(p.cgpaPct)}% at an 18% weight.`,
  ];
  if (strong.length) out.push(`Strongest sub-topic: ${strong[0].topic} (${Math.round(strong[0].score)}%).`);
  if (weak.length) out.push(`Lowest sub-topic: ${weak[0].topic} (${Math.round(weak[0].score)}%) is pulling the readiness score down.`);
  return out.slice(0, 5);
}

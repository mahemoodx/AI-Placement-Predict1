// Dynamic AI recommendation engine — derived purely from the scores provided.

export function strongTopics(topics, min = 90) {
  return topics.filter((t) => t.score >= min).sort((a, b) => b.score - a.score);
}

export function weakTopics(topics, max = 60) {
  return topics.filter((t) => t.score < max).sort((a, b) => a.score - b.score);
}

export function sectionRank(p) {
  return [
    { section: "Aptitude", value: p.aptitudeAvg },
    { section: "Reasoning", value: p.reasoningAvg },
    { section: "English", value: p.englishAvg },
    { section: "Coding", value: p.coding },
    { section: "DSA", value: p.dsa },
  ].sort((a, b) => b.value - a.value);
}

export function suitableRoles(p) {
  const roles = [];
  if (p.coding >= 80 && p.dsa >= 80) roles.push("Software Development Engineer");
  if (p.coding >= 65) roles.push("Software Engineer / Application Developer");
  if (p.aptitudeAvg >= 70 && p.reasoningAvg >= 70) roles.push("Data / Business Analyst");
  if (p.englishAvg >= 75) roles.push("Technical Support & Consulting");
  if (p.coding >= 55 && p.dsa >= 55) roles.push("QA / Automation Engineer");
  if (!roles.length) roles.push("Trainee Engineer (after foundation training)");
  return [...new Set(roles)];
}

export function suggestedCompanies(p) {
  if (p.probability >= 85) return ["Amazon", "Microsoft", "Google", "Salesforce", "Accenture (Digital)"];
  if (p.probability >= 70) return ["TCS Digital", "Infosys Power Programmer", "Cognizant GenC Next", "Deloitte"];
  if (p.probability >= 50) return ["TCS Ninja", "Wipro Elite", "Capgemini", "Tech Mahindra"];
  return ["Mass recruiters after focused training", "Internship / apprenticeship programmes"];
}

export function recommendations(p, weak, strong) {
  const out = [];
  out.push(`Overall category: ${p.category}`);
  out.push(`Placement probability: ${Math.round(p.probability)}%`);
  const best = sectionRank(p)[0];
  out.push(`Strongest overall: ${best.section} (${best.value.toFixed(1)}%)`);

  if (p.probability >= 85) out.push("Ready for product-based company interviews");
  else if (p.probability >= 70) out.push("Ready for service-based drives — target product companies with more DSA practice");
  else if (p.probability >= 50) out.push("Attend structured placement training before the main drives");
  else out.push("Start a foundation programme covering aptitude, coding and DSA");

  if (p.dsa >= 75) out.push("Continue practicing DSA to hold the current level");
  else out.push("Solve at least 3 DSA problems daily to lift the DSA score");

  weak.slice(0, 5).forEach((t) => out.push(`Improve ${t.topic} (${Math.round(t.score)}%) — currently below 60%`));

  if (p.englishAvg < 70) out.push("Practice vocabulary and reading comprehension daily");
  if (p.coding < 60) out.push("Revise programming logic and language fundamentals");
  out.push("Attend mock interviews and group discussions");
  if (strong.length) out.push(`Use ${strong[0].topic} strength as an interview talking point`);
  return out;
}

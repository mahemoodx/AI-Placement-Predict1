import { statusOf } from "@/lib/placement-data";

const TONE = {
  Excellent: "bg-success/15 text-success",
  Good: "bg-primary/15 text-primary",
  Average: "bg-chart-4/20 text-chart-4",
  "Needs Improvement": "bg-destructive/15 text-destructive",
};

const BAR = {
  Excellent: "bg-success",
  Good: "bg-primary",
  Average: "bg-chart-4",
  "Needs Improvement": "bg-destructive",
};

export function TopicRow({ topic, score }) {
  const status = statusOf(score);
  return (
    <li className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{topic}</span>
        <span className="flex items-center gap-2">
          <span className="tabular-nums font-semibold">{Math.round(score)}%</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONE[status]}`}>{status}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${BAR[status]}`}
          style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
        />
      </div>
    </li>
  );
}

/** Topic-wise analysis card — one per assessment section. */
export function TopicCard({ title, topics, average }) {
  const entries = Object.entries(topics ?? {});
  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {average !== undefined ? (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
            Overall {Math.round(average)}%
          </span>
        ) : null}
      </div>
      {entries.length ? (
        <ul className="space-y-3">
          {entries.map(([topic, value]) => (
            <TopicRow key={topic} topic={topic} score={value} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">These sub-topics are not present in the uploaded CSV.</p>
      )}
    </div>
  );
}

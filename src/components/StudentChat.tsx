import { Bot, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { STUDENT_SUGGESTIONS, answerStudent, type Mode } from "@/lib/ai-advisor";
import type { Scored } from "@/lib/placement-data";

interface Msg {
  role: "user" | "ai";
  text: string;
}

export function StudentChat({ student, cohort }: { student: Scored; cohort: Scored[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("basic");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMessages([
      {
        role: "ai",
        text: `Student context loaded successfully.\n\nI have ${student.name}'s (${student.id}, ${student.branch}) full profile and prediction. Ask me anything about this student.`,
      },
    ]);
  }, [student.id, student.name, student.branch]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    const reply = answerStudent(q, student, cohort, mode);
    setMessages((m) => [...m, { role: "user", text: q }, { role: "ai", text: reply }]);
    setInput("");
  };

  const initials = student.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const panel = (
    <div className="no-print fixed inset-0 z-[100] flex justify-end">
      <button
        aria-label="Close chat"
        onClick={() => setOpen(false)}
        className="absolute inset-0 h-full w-full cursor-default bg-foreground/40 backdrop-blur-sm"
      />

      <aside className="relative flex h-full w-full max-w-[440px] flex-col border-l border-border bg-card text-card-foreground shadow-2xl">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-border bg-secondary/60 px-4 py-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Bot className="size-4 text-primary" /> AI Career Assistant
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {student.name} · {student.id} · {Math.round(student.prediction.probability)}% probability
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Answer depth</span>
          <div className="ml-auto inline-flex rounded-lg bg-secondary p-0.5">
            {(["basic", "advanced", "executive"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                  mode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Transcript */}
        <div className="flex-1 space-y-4 overflow-y-auto bg-background px-4 py-4">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground shadow-sm">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-2.5">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="size-3.5" />
                </span>
                <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2 text-sm leading-relaxed text-foreground shadow-sm">
                  {m.text}
                </div>
              </div>
            ),
          )}
          <div ref={endRef} />
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5 border-t border-border bg-card px-4 py-2.5">
          {STUDENT_SUGGESTIONS.slice(0, 4).map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="border-t border-border bg-card p-3"
        >
          <div className="flex items-end gap-2 rounded-xl border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder="Ask about strengths, training, eligibility…"
              className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </div>
          <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
            Answers use only this student's uploaded CSV data. Enter to send · Shift+Enter for a new line.
          </p>
        </form>
      </aside>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="no-print flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
      >
        <Bot className="size-4" /> Ask AI About This Student
      </button>

      {mounted && open ? createPortal(panel, document.body) : null}
    </>
  );
}

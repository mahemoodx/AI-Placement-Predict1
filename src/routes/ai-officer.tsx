import { createFileRoute } from "@tanstack/react-router";
import { Bot, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PredictionCenter } from "@/components/PredictionCenter";
import { answerOfficer, officerSuggestions, type Mode } from "@/lib/ai-advisor";
import { usePlacementData } from "@/lib/placement-store";

export const Route = createFileRoute("/ai-officer")({
  head: () => ({
    meta: [
      { title: "AI Placement Officer Assistant | PlacementIQ" },
      { name: "description", content: "Ask college-level questions about branch performance, skill gaps and training priorities." },
      { property: "og:title", content: "AI Placement Officer Assistant | PlacementIQ" },
      { property: "og:description", content: "Batch-level placement planning powered by your uploaded dataset." },
    ],
  }),
  component: OfficerPage,
});

function OfficerPage() {
  const { students } = usePlacementData();
  const [mode, setMode] = useState<Mode>("advanced");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Dataset loaded. Ask me anything about the batch: branches, skill gaps, training priorities or the predicted placement rate." },
  ]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [messages]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = (q: string) => {
    const question = q.trim();
    if (!question) return;
    setMessages((m) => [...m, { role: "user", text: question }, { role: "ai", text: answerOfficer(question, students, mode) }]);
    setInput("");
  };

  return (
    <AppShell>
      <PredictionCenter students={students} />

      <h2 className="mt-10 flex items-center gap-2 font-display text-xl font-semibold">
        <Bot className="size-5 text-primary" /> AI Placement Officer Assistant
      </h2>
      <div className="panel mt-4 flex h-[70vh] flex-col">
        <div className="flex gap-1 border-b border-border p-3 text-xs">
          {(["basic", "advanced"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1.5 capitalize ${mode === m ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex-1 space-y-3 overflow-auto p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              {m.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-border p-3">
          {officerSuggestions(students).map((s) => (
            <button key={s} onClick={() => ask(s)} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-end gap-2 border-t border-border p-3"
        >
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            placeholder="e.g. Which branch has the highest placement probability?"
            className="flex-1 resize-none rounded-lg border border-input bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit" className="rounded-lg bg-primary p-2.5 text-primary-foreground">
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}

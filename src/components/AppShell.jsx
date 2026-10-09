import { Link } from "@tanstack/react-router";
import { LogOut, Moon, Sun, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { usePlacementData } from "@/lib/placement-store";
import { isAdminLoggedIn, logoutAdmin } from "@/lib/admin-auth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/ai-predictor", label: "Predictor" },
  { to: "/students", label: "Students" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/ai-officer", label: "AI Prediction" },
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
      }}
      className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

/* Full-page gate shown until a CSV is uploaded in this session. */
function UploadGate() {
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Upload Placement Dataset</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Please upload the placement CSV file to start prediction and analytics.
        </p>
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
        className={`mt-10 flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-24 text-center transition-colors ${
          over ? "border-primary bg-secondary/60" : "border-border"
        }`}
      >
        <span className="hero-surface flex size-16 items-center justify-center rounded-2xl">
          <UploadCloud className="size-7" />
        </span>
        <p className="font-display text-2xl font-bold">Drag &amp; drop your CSV here</p>
        <p className="text-sm text-muted-foreground">
          Data stays in memory for this session only — refreshing or logging out clears it.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => void handle(e.target.files?.[0])}
        />
        <span className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          {busy ? "Parsing…" : "Upload CSV"}
        </span>
      </div>
    </div>
  );
}

export function AppShell({ children }) {
  const { hasData, fileName, students, reset } = usePlacementData();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate({ to: "/login", replace: true });
      return;
    }
    setReady(true);
  }, [navigate, pathname]);

  if (!ready) return null;

  const logout = () => {
    reset();
    logoutAdmin();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="hero-surface flex size-9 items-center justify-center rounded-full font-display text-base font-bold">
              P
            </span>
            <span className="font-display text-xl font-bold tracking-tight">PlaceReady</span>
          </Link>
          <nav className="ml-auto flex flex-wrap items-center gap-1">
            {hasData
              ? NAV.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    activeOptions={{ exact: to === "/" }}
                    activeProps={{ className: "text-foreground" }}
                    className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                ))
              : null}
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
            >
              <LogOut className="size-4" />
              Logout
            </button>
            <ThemeToggle />
          </nav>
        </div>
        {hasData ? (
          <div className="mx-auto max-w-7xl px-6 pb-2 text-xs text-muted-foreground">
            {fileName} · {students.length} students
          </div>
        ) : null}
      </header>
      {hasData ? <main className="mx-auto max-w-7xl px-6 py-10">{children}</main> : <UploadGate />}
    </div>
  );
}

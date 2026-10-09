import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, GraduationCap, Lock, LogIn, Mail, Users } from "lucide-react";
import { checkAdminCredentials, isAdminLoggedIn, loginAdmin } from "@/lib/admin-auth";
import illustration from "@/assets/login-illustration.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Admin Login | Placement Partner AI" },
      {
        name: "description",
        content:
          "Secure admin login for Placement Partner AI, the AI-powered college placement prediction system for placement officers.",
      },
      { property: "og:title", content: "Admin Login | Placement Partner AI" },
      {
        property: "og:description",
        content: "Sign in as admin to access placement analytics, student profiles and AI predictions.",
      },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdminLoggedIn()) navigate({ to: "/", replace: true });
  }, [navigate]);

  function onSubmit(e) {
    e.preventDefault();
    if (!checkAdminCredentials(email, password)) {
      setError("Invalid Admin Email or Password. Please enter the correct credentials.");
      return;
    }
    setError("");
    loginAdmin();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4 sm:p-8">
      <div className="panel grid w-full max-w-5xl overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-panel-hover)] hover:-translate-y-0.5 md:grid-cols-[1.1fr_1fr]">
        {/* Left */}
        <div className="hero-surface relative hidden flex-col justify-between p-10 md:flex">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-white/15">
                <GraduationCap className="size-6" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold leading-tight">Placement Partner AI</h2>
                <p className="text-xs opacity-80">AI-Powered College Placement Prediction System</p>
              </div>
            </div>
            <div className="mt-10 max-w-sm">
              <h1 className="font-display text-4xl font-bold leading-tight">
                Predict. Prepare. <span className="opacity-80">Place.</span>
              </h1>
              <div className="mt-4 h-1 w-14 rounded-full bg-white/70" />
              <p className="mt-5 text-sm leading-relaxed opacity-90">
                AI-driven platform that helps placement officers analyze student performance, predict placement
                probability, and generate intelligent recommendations using Machine Learning.
              </p>
            </div>
          </div>
          <img
            src={illustration}
            alt="Placement analytics dashboard illustration"
            width={1024}
            height={1024}
            className="mt-8 w-full rounded-2xl object-cover shadow-lg"
          />
        </div>

        {/* Right */}
        <div className="flex flex-col justify-center bg-card p-8 sm:p-12">
          <div className="mx-auto w-full max-w-sm">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
              <Users className="size-6" />
            </div>
            <h2 className="mt-5 text-center font-display text-2xl font-bold">Welcome Back!</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">Login to access your dashboard</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="admin-email" className="text-sm font-semibold">
                  Admin Email
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-input bg-background px-3 transition-all duration-200 hover:border-primary/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                  <Mail className="size-4 text-muted-foreground" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-transparent py-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="admin-password" className="text-sm font-semibold">
                  Admin Password
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-input bg-background px-3 transition-all duration-200 hover:border-primary/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                  <Lock className="size-4 text-muted-foreground" />
                  <input
                    id="admin-password"
                    type={show ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-transparent py-2.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setShow((s) => !s)}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 cursor-pointer rounded border-input accent-[var(--primary)] transition-shadow hover:ring-2 hover:ring-primary/20"
                />
                Remember me
              </label>

              {error ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</p>
              ) : null}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 active:translate-y-0 active:scale-[0.98]"
              >
                <LogIn className="size-4" />
                Login
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              © 2026 Placement Partner AI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { Mail } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthMode = "signin" | "signup" | "magic";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { signIn, signUp, signInWithMagicLink, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  function resetState() {
    setMode("signin");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSubmitting(false);
    setMagicSent(false);
  }

  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setError(null);
    setPassword("");
    setConfirmPassword("");
    setMagicSent(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      let result: { error?: string };

      if (mode === "signin") {
        result = await signIn(email, password);
      } else if (mode === "signup") {
        result = await signUp(email, password);
      } else {
        result = await signInWithMagicLink(email);
      }

      if (result.error) {
        setError(result.error);
      } else {
        if (mode === "signin") {
          handleOpenChange(false);
        } else if (mode === "signup") {
          setMagicSent(true);
        } else {
          setMagicSent(true);
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
    }
  }

  const title =
    mode === "signin"
      ? "Welcome back"
      : mode === "signup"
        ? "Create your account"
        : "Magic link sign in";

  const description =
    mode === "signin"
      ? "Sign in to track your streaks and stats"
      : mode === "signup"
        ? "Join Playpile and start solving"
        : "We'll email you a link to sign in — no password needed";

  const submitLabel =
    mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send magic link";

  const submittingLabel =
    mode === "signin" ? "Signing in..." : mode === "signup" ? "Creating account..." : "Sending...";

  const inputClassName =
    "w-full rounded-xl border-2 border-foreground bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border-2 border-foreground p-0 sm:rounded-3xl">
        {/* Decorative colored strip */}
        <div className="h-2 bg-card-yellow" />

        <DialogHeader className="px-6 pb-2 pt-6 text-center sm:text-center">
          <DialogTitle className="font-display text-center text-2xl font-black">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6">
          {/* ── Google OAuth ── */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-foreground bg-card px-4 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 py-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* ── Magic link success ── */}
          {magicSent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card-mint">
                <Mail className="h-6 w-6 text-foreground" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-medium text-foreground">
                {mode === "signup" ? (
                  "Account created! Check your email to confirm your account."
                ) : (
                  <>
                    Check your email! We sent a magic link to{" "}
                    <span className="font-bold">{email}</span>. Click the link to sign in.
                  </>
                )}
              </p>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClassName}
                autoComplete="email"
              />

              {mode !== "magic" && (
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClassName}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              )}

              {mode === "signup" && (
                <input
                  type="password"
                  placeholder="Confirm password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClassName}
                  autoComplete="new-password"
                />
              )}

              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl border-2 border-foreground bg-foreground px-4 py-3 text-sm font-bold text-background transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {submitting ? submittingLabel : submitLabel}
              </button>
            </form>
          )}
        </div>

        {/* ── Mode switching links ── */}
        <div className="px-6 pb-6 pt-2">
          {mode === "signin" && (
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="text-sm text-muted-foreground"
              >
                Don&apos;t have an account?{" "}
                <span className="font-bold text-foreground underline">Sign up</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode("magic")}
                className="text-sm text-muted-foreground"
              >
                <span className="font-bold text-foreground underline">Sign in with magic link</span>
              </button>
            </div>
          )}

          {mode === "signup" && (
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-sm text-muted-foreground"
              >
                Already have an account?{" "}
                <span className="font-bold text-foreground underline">Sign in</span>
              </button>
            </div>
          )}

          {mode === "magic" && (
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-sm text-muted-foreground"
              >
                <span className="font-bold text-foreground underline">Sign in with password</span>
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

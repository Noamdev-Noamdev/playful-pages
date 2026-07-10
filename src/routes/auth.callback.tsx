import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback" as never)({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finishSignIn() {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(
        url.hash.startsWith("#") ? url.hash.slice(1) : url.hash,
      );
      const callbackError =
        url.searchParams.get("error_description") ||
        url.searchParams.get("error") ||
        hashParams.get("error_description") ||
        hashParams.get("error");

      if (callbackError) {
        if (!cancelled) {
          setErrorMessage(callbackError);
          setStatus("error");
        }
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (!cancelled && data.session && !error) {
        window.location.replace("/");
        return;
      }

      if (!cancelled) {
        setErrorMessage(
          error?.message || "Google sign-in could not be completed. Please try again.",
        );
        setStatus("error");
      }
    }

    finishSignIn();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-3xl border-2 border-foreground bg-card p-8 text-center shadow-[4px_4px_0_0_var(--foreground)]">
          <h1 className="font-display text-3xl font-black text-foreground">
            Google sign-in failed
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {errorMessage || "We could not finish your Google sign-in."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-xl border-2 border-foreground bg-foreground px-4 py-3 text-sm font-bold text-background transition-transform hover:-translate-y-0.5"
            >
              Go Home
            </a>
            <button
              type="button"
              onClick={() => window.location.replace("/")}
              className="inline-flex items-center justify-center rounded-xl border-2 border-foreground bg-card px-4 py-3 text-sm font-bold text-foreground transition-transform hover:-translate-y-0.5"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl font-black text-foreground">Signing you in...</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Please wait while we finish your Google sign-in.
        </p>
      </div>
    </div>
  );
}

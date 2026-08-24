import { createFileRoute, Link } from "@tanstack/react-router";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent" />
          <p className="font-display font-bold text-muted-foreground">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-6xl font-bold tracking-tight text-foreground font-display">403</h1>
          <h2 className="mt-4 text-xl font-bold text-foreground">Admin Access Required</h2>
          <p className="mt-2 text-sm text-muted-foreground font-medium">
            This analytics dashboard is restricted to administrator accounts only. Please sign in
            with an admin account.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-foreground bg-card-yellow px-5 py-2.5 text-sm font-extrabold shadow-[4px_4px_0_0_var(--foreground)] hover:-translate-y-0.5 transition-transform"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <AnalyticsDashboard />;
}

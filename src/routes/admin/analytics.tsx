import { createFileRoute, redirect } from "@tanstack/react-router";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/analytics")({
  beforeLoad: async () => {
    // Server-side API endpoints also independently verify admin status,
    // so this is a UX guard — not the sole security layer.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      throw redirect({ to: "/" });
    }

    // Check admin status from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single();

    if (!profile?.is_admin) {
      throw redirect({ to: "/" });
    }
  },
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return <AnalyticsDashboard />;
}

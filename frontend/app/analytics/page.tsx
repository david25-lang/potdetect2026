import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AnalyticsPage } from "@/components/pages/analytics-page";

export default function Page() {
  return (
    <DashboardShell
      title="Analytics"
      subtitle="Trends, distribution, and model performance insights"
    >
      <AnalyticsPage />
    </DashboardShell>
  );
}

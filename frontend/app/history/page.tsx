import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HistoryPage } from "@/components/pages/history-page";

export default function Page() {
  return (
    <DashboardShell
      title="Detection History"
      subtitle="Review and filter historical model results"
    >
      <HistoryPage />
    </DashboardShell>
  );
}

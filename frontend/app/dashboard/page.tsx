import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardPage } from "@/components/pages/dashboard-page";

export default function Page() {
  return (
    <DashboardShell
      title="Operational Dashboard"
      subtitle="Monitor city-wide road damage detection in real time"
    >
      <DashboardPage />
    </DashboardShell>
  );
}

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SettingsPage } from "@/components/pages/settings-page";

export default function Page() {
  return (
    <DashboardShell
      title="Settings"
      subtitle="Configure notifications and backend integration preferences"
    >
      <SettingsPage />
    </DashboardShell>
  );
}

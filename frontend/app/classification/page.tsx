import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ClassificationPage } from "@/components/pages/classification-page";

export default function Page() {
  return (
    <DashboardShell
      title="CNN Classification"
      subtitle="Classify road damage as pothole or crack using the trained CNN model"
    >
      <ClassificationPage />
    </DashboardShell>
  );
}

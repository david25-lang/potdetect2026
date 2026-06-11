import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TestModelPage } from "@/components/pages/test-model-page";

export default function Page() {
  return (
    <DashboardShell
      title="Test Model"
      subtitle="Upload an image and run YOLO inference directly on the backend"
    >
      <TestModelPage />
    </DashboardShell>
  );
}

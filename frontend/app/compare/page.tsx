import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ComparePage } from "@/components/pages/compare-page";

export default function Page() {
  return (
    <DashboardShell
      title="YOLO vs CNN"
      subtitle="Upload one image and run both models side by side"
    >
      <ComparePage />
    </DashboardShell>
  );
}

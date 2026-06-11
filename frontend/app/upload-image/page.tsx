import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ImageDetectionPage } from "@/components/pages/image-detection-page";

export default function Page() {
  return (
    <DashboardShell
      title="Image Detection"
      subtitle="Upload still images for pothole and crack detection"
    >
      <ImageDetectionPage />
    </DashboardShell>
  );
}

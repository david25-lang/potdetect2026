import { DashboardShell } from "@/components/layout/dashboard-shell";
import { VideoDetectionPage } from "@/components/pages/video-detection-page";

export default function Page() {
  return (
    <DashboardShell
      title="Video Detection"
      subtitle="Process roadway video streams and summarize damage"
    >
      <VideoDetectionPage />
    </DashboardShell>
  );
}

import { LoadingSpinner } from "@/components/common/loading-spinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner label="Loading page..." className="text-base" />
    </div>
  );
}

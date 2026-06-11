import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  label?: string;
}

export function LoadingSpinner({ className, label }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      <LoaderCircle className="h-4 w-4 animate-spin" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}

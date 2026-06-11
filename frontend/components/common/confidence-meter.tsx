import { Progress } from "@/components/ui/progress";
import { formatPercent } from "@/lib/utils";

interface ConfidenceMeterProps {
  label: string;
  confidence: number;
}

export function ConfidenceMeter({ label, confidence }: ConfidenceMeterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium capitalize">{label}</span>
        <span className="text-muted-foreground">{formatPercent(confidence)}</span>
      </div>
      <Progress value={confidence * 100} />
    </div>
  );
}

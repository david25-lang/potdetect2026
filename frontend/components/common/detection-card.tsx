import { AlertTriangle, ScanSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

interface DetectionCardProps {
  label: string;
  confidence: number;
}

export function DetectionCard({ label, confidence }: DetectionCardProps) {
  const isPothole = label.toLowerCase() === "pothole";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="inline-flex items-center gap-2 capitalize">
            {isPothole ? (
              <AlertTriangle className="h-4 w-4 text-warning" />
            ) : (
              <ScanSearch className="h-4 w-4 text-primary" />
            )}
            {label}
          </span>
          <Badge variant={confidence > 0.9 ? "success" : "warning"}>
            {formatPercent(confidence)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        AI model confidence indicates this damage region should be prioritized in
        maintenance scheduling.
      </CardContent>
    </Card>
  );
}

import Image from "next/image";

import type { DetectionResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceMeter } from "@/components/common/confidence-meter";

interface ResultViewerProps {
  originalPreview?: string;
  result: DetectionResponse;
}

export function ResultViewer({ originalPreview, result }: ResultViewerProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Original Image</CardTitle>
        </CardHeader>
        <CardContent>
          {originalPreview ? (
            <div className="relative aspect-video overflow-hidden rounded-md border border-border/60">
              <Image src={originalPreview} alt="Original upload" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              No original image preview available.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detected Image</CardTitle>
        </CardHeader>
        <CardContent>
          {result.processed_image ? (
            <div className="relative aspect-video overflow-hidden rounded-md border border-border/60">
              <Image src={result.processed_image} alt="Processed result" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              Processed image unavailable.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Detection Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.detections.map((det) => (
            <ConfidenceMeter
              key={`${det.class}-${det.confidence}`}
              label={det.class}
              confidence={det.confidence}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ScanSearch, Target } from "lucide-react";
import { ConfidenceMeter } from "@/components/common/confidence-meter";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { UploadZone } from "@/components/common/upload-zone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

interface YoloDetection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number];
}

interface YoloResult {
  detections: YoloDetection[];
  annotated_image: string;
  image_format: string;
}

interface CnnResult {
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
}

type Status = "idle" | "loading" | "done" | "error";

export function ComparePage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [yolo, setYolo] = useState<YoloResult | null>(null);
  const [cnn, setCnn] = useState<CnnResult | null>(null);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleCompare = async () => {
    if (!file) {
      setError("Please select or capture an image first.");
      return;
    }

    setError(null);
    setStatus("loading");
    setYolo(null);
    setCnn(null);

    const yoloForm = new FormData();
    yoloForm.append("image", file);

    const cnnForm = new FormData();
    cnnForm.append("image", file);

    try {
      const [yoloRes, cnnRes] = await Promise.all([
        fetch(`${BACKEND_URL}/predict-annotated/`, { method: "POST", body: yoloForm }),
        fetch(`${BACKEND_URL}/classify`, { method: "POST", body: cnnForm }),
      ]);

      const [yoloData, cnnData] = await Promise.all([
        yoloRes.ok
          ? (yoloRes.json() as Promise<YoloResult>)
          : yoloRes.json().then((b: { detail?: string }) => { throw new Error(b?.detail ?? `YOLO error (${yoloRes.status})`); }),
        cnnRes.ok
          ? (cnnRes.json() as Promise<CnnResult>)
          : cnnRes.json().then((b: { detail?: string }) => { throw new Error(b?.detail ?? `CNN error (${cnnRes.status})`); }),
      ]);

      setYolo(yoloData);
      setCnn(cnnData);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed.");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setYolo(null);
    setCnn(null);
    setError(null);
    setStatus("idle");
  };

  const onFileSelect = (f: File) => {
    setFile(f);
    setYolo(null);
    setCnn(null);
    setError(null);
    setStatus("idle");
  };

  const annotatedSrc = yolo
    ? `data:image/${yolo.image_format ?? "jpeg"};base64,${yolo.annotated_image}`
    : null;

  const detections = yolo?.detections ?? [];
  const avgConf =
    detections.length > 0
      ? detections.reduce((s, d) => s + d.confidence, 0) / detections.length
      : 0;

  const isPothole = cnn?.prediction.toLowerCase() === "pothole";

  return (
    <div className="space-y-6">
      {/* Input card */}
      <Card>
        <CardHeader>
          <CardTitle>Input Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadZone
            accept="image/*"
            label="Upload a road image to compare YOLO and CNN"
            onFileSelect={onFileSelect}
            type="image"
          />

          {previewUrl ? (
            <div className="relative aspect-video overflow-hidden rounded-md border border-border/60">
              <Image src={previewUrl} alt="Selected image" fill className="object-contain" unoptimized />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleCompare} disabled={!file || status === "loading"}>
              {status === "loading" ? "Processing…" : "Compare"}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={status === "loading"}>
              Reset
            </Button>
            {status === "loading" ? <LoadingSpinner label="Processing…" /> : null}
          </div>

          {error ? (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Results */}
      {status === "done" && yolo && cnn ? (
        <>
          {/* Summary row */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={<Target className="h-5 w-5 text-primary" />} label="YOLO Detections" value={detections.length} />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-success" />}
              label="YOLO Avg Confidence"
              value={detections.length > 0 ? formatPercent(avgConf) : "—"}
            />
            <StatCard
              icon={isPothole ? <AlertTriangle className="h-5 w-5 text-warning" /> : <ScanSearch className="h-5 w-5 text-primary" />}
              label="CNN Prediction"
              value={cnn.prediction}
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-success" />}
              label="CNN Confidence"
              value={formatPercent(cnn.confidence)}
            />
          </div>

          {/* Side-by-side model outputs */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* YOLO column */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">YOLO Detection</h2>

              <Card>
                <CardHeader><CardTitle className="text-sm">Annotated Output</CardTitle></CardHeader>
                <CardContent>
                  {annotatedSrc ? (
                    <div className="relative aspect-video overflow-hidden rounded-md border border-border/60">
                      <Image src={annotatedSrc} alt="YOLO annotated" fill className="object-contain" unoptimized />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                      No annotated image returned.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">Detections</CardTitle></CardHeader>
                <CardContent>
                  {detections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No damage detected.</p>
                  ) : (
                    <div className="space-y-3">
                      {detections.map((det, i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={det.class_name.toLowerCase() === "pothole" ? "warning" : "default"}
                              className="capitalize"
                            >
                              {det.class_name}
                            </Badge>
                          </div>
                          <ConfidenceMeter label="" confidence={det.confidence} />
                          <span className="shrink-0 tabular-nums text-sm font-medium">
                            {formatPercent(det.confidence)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* CNN column */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">CNN Classification</h2>

              <Card>
                <CardHeader><CardTitle className="text-sm">Original Image</CardTitle></CardHeader>
                <CardContent>
                  <div className="relative aspect-video overflow-hidden rounded-md border border-border/60">
                    <Image src={previewUrl!} alt="Original" fill className="object-contain" unoptimized />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    {isPothole ? (
                      <AlertTriangle className="h-10 w-10 shrink-0 text-warning" />
                    ) : (
                      <ScanSearch className="h-10 w-10 shrink-0 text-primary" />
                    )}
                    <div>
                      <p className="text-3xl font-bold capitalize tracking-tight">{cnn.prediction}</p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums text-muted-foreground">
                        {formatPercent(cnn.confidence)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold capitalize">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

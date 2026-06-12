"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Camera, CheckCircle2, ScanSearch, Target } from "lucide-react";

import { CameraCapture } from "@/components/common/camera-capture";
import { ConfidenceMeter } from "@/components/common/confidence-meter";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { UploadZone } from "@/components/common/upload-zone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

interface BackendDetection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number];
}

interface BackendResponse {
  detections: BackendDetection[];
  annotated_image: string;
  image_format: string;
}

export function TestModelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BackendResponse | null>(null);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const annotatedSrc = result
    ? `data:image/${result.image_format ?? "jpeg"};base64,${result.annotated_image}`
    : null;

  const detections = result?.detections ?? [];
  const potholes = detections.filter((d) => d.class_name.toLowerCase() === "pothole").length;
  const cracks = detections.filter((d) => d.class_name.toLowerCase() === "crack").length;
  const avgConfidence =
    detections.length > 0
      ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length
      : 0;

  const handleDetect = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const form = new FormData();
      form.append("image", file);

      const res = await fetch(`${BACKEND_URL}/predict-annotated/`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null) as { detail?: string } | null;
        throw new Error(body?.detail ?? `Server error (${res.status})`);
      }

      setResult(await res.json() as BackendResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upload Image</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowCamera((v) => !v); setError(null); }}
            >
              <Camera className="h-4 w-4" />
              {showCamera ? "Use Upload" : "Use Camera"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCamera ? (
            <CameraCapture
              onCapture={(f) => { setFile(f); setResult(null); setError(null); setShowCamera(false); }}
              onClose={() => setShowCamera(false)}
            />
          ) : (
            <UploadZone
              accept="image/*"
              label="Upload a road image for YOLO inference"
              onFileSelect={(f) => { setFile(f); setResult(null); setError(null); }}
              type="image"
            />
          )}

          {previewUrl ? (
            <div className="relative aspect-video overflow-hidden rounded-md border border-border/60">
              <Image
                src={previewUrl}
                alt="Selected image preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleDetect} disabled={!file || loading}>
              {loading ? "Running…" : "Detect"}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              Reset
            </Button>
            {loading ? <LoadingSpinner label="Sending to backend…" /> : null}
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </CardContent>
      </Card>

      {result ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Target className="h-5 w-5 text-primary" />}
              label="Total Detections"
              value={detections.length}
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5 text-warning" />}
              label="Potholes"
              value={potholes}
            />
            <StatCard
              icon={<ScanSearch className="h-5 w-5 text-primary" />}
              label="Cracks"
              value={cracks}
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-success" />}
              label="Avg Confidence"
              value={detections.length > 0 ? formatPercent(avgConfidence) : "—"}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Original</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video overflow-hidden rounded-md border border-border/60">
                  <Image
                    src={previewUrl!}
                    alt="Original upload"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Annotated (Backend)</CardTitle>
              </CardHeader>
              <CardContent>
                {annotatedSrc ? (
                  <div className="relative aspect-video overflow-hidden rounded-md border border-border/60">
                    <Image
                      src={annotatedSrc}
                      alt="Annotated result from backend"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
                    Annotated image unavailable.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detections</CardTitle>
            </CardHeader>
            <CardContent>
              {detections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No damage detected in this image.</p>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    {detections.map((det, i) => (
                      <ConfidenceMeter
                        key={i}
                        label={det.class_name}
                        confidence={det.confidence}
                      />
                    ))}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60 text-left text-muted-foreground">
                          <th className="pb-2 pr-4 font-medium">#</th>
                          <th className="pb-2 pr-4 font-medium">Class</th>
                          <th className="pb-2 pr-4 font-medium">Confidence</th>
                          <th className="pb-2 font-medium">Bounding Box (x1, y1, x2, y2)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detections.map((det, i) => (
                          <tr key={i} className="border-b border-border/40 last:border-0">
                            <td className="py-2.5 pr-4 text-muted-foreground">{i + 1}</td>
                            <td className="py-2.5 pr-4">
                              <Badge
                                variant={
                                  det.class_name.toLowerCase() === "pothole"
                                    ? "warning"
                                    : "default"
                                }
                                className="capitalize"
                              >
                                {det.class_name}
                              </Badge>
                            </td>
                            <td className="py-2.5 pr-4 font-medium">
                              {formatPercent(det.confidence)}
                            </td>
                            <td className="py-2.5 font-mono text-xs text-muted-foreground">
                              [{det.bbox.map((v) => Math.round(v)).join(", ")}]
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

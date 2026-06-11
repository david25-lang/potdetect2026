"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Camera, ScanSearch } from "lucide-react";

import { CameraCapture } from "@/components/common/camera-capture";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { UploadZone } from "@/components/common/upload-zone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

interface ClassificationResult {
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export function ClassificationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleClassify = async () => {
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

      const res = await fetch(`${API_URL}/classify`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null) as { detail?: string } | null;
        throw new Error(body?.detail ?? `Server error (${res.status})`);
      }

      setResult(await res.json() as ClassificationResult);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Cannot reach the backend. Make sure the server is running on port 8000.");
      } else {
        setError(err instanceof Error ? err.message : "Classification failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const isPothole = result?.prediction.toLowerCase() === "pothole";

  return (
    <div className="space-y-6">
      {/* Upload section */}
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
              label="Upload a road image for CNN classification"
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
            <Button onClick={handleClassify} disabled={!file || loading}>
              {loading ? "Analyzing…" : "Classify"}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={loading}>
              Reset
            </Button>
            {loading ? <LoadingSpinner label="Analyzing image…" /> : null}
          </div>

          {error ? (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Results section */}
      {result ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {isPothole ? (
                <AlertTriangle className="h-10 w-10 shrink-0 text-warning" />
              ) : (
                <ScanSearch className="h-10 w-10 shrink-0 text-primary" />
              )}
              <div>
                <p className="text-3xl font-bold capitalize tracking-tight">
                  {result.prediction}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-muted-foreground">
                  {formatPercent(result.confidence)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

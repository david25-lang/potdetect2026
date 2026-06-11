"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { detectImage } from "@/lib/api";
import type { DetectionResponse } from "@/lib/types";
import { DetectionCard } from "@/components/common/detection-card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ResultViewer } from "@/components/common/result-viewer";
import { UploadZone } from "@/components/common/upload-zone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DetectionForm {
  file: File | null;
}

export function ImageDetectionPage() {
  const { setValue, handleSubmit, reset } = useForm<DetectionForm>({
    defaultValues: { file: null },
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onSubmit = async (values: DetectionForm) => {
    if (!values.file) {
      setError("Please select an image before submitting.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await detectImage(values.file);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Image Detection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadZone
            accept="image/*"
            label="Upload a road image"
            onFileSelect={(selected) => {
              setSelectedFile(selected);
              setValue("file", selected);
            }}
            type="image"
          />

          {previewUrl ? (
            <div className="relative aspect-video overflow-hidden rounded-md border border-border/60">
              <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submitting}>
              Submit to Backend
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSelectedFile(null);
                setResult(null);
                setError(null);
              }}
            >
              Reset
            </Button>
            {submitting ? <LoadingSpinner label="Analyzing image..." /> : null}
          </form>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </CardContent>
      </Card>

      {result ? (
        <>
          <ResultViewer originalPreview={previewUrl ?? undefined} result={result} />
          <div className="grid gap-4 sm:grid-cols-2">
            {result.detections.map((det) => (
              <DetectionCard
                key={`${det.class}-${det.confidence}`}
                label={det.class}
                confidence={det.confidence}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

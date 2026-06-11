"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { detectVideo } from "@/lib/api";
import type { DetectionResponse } from "@/lib/types";
import { ConfidenceMeter } from "@/components/common/confidence-meter";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { UploadZone } from "@/components/common/upload-zone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VideoForm {
  file: File | null;
}

export function VideoDetectionPage() {
  const { setValue, handleSubmit, reset } = useForm<VideoForm>({
    defaultValues: { file: null },
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState("Idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);

  const onSubmit = async (values: VideoForm) => {
    if (!values.file) {
      setError("Please select a video before submitting.");
      return;
    }

    setSubmitting(true);
    setStatus("Processing");
    setError(null);

    try {
      const response = await detectVideo(values.file);
      setResult(response);
      setStatus("Completed");
    } catch (err) {
      setStatus("Failed");
      setError(err instanceof Error ? err.message : "Video processing failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Video Detection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadZone
            accept="video/*"
            label="Upload inspection video"
            onFileSelect={(selected) => {
              setSelectedFile(selected);
              setValue("file", selected);
            }}
            type="video"
          />

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submitting}>
              Start Processing
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSelectedFile(null);
                setResult(null);
                setStatus("Idle");
                setError(null);
              }}
            >
              Clear
            </Button>
            {submitting ? <LoadingSpinner label="Processing frames..." /> : null}
          </form>

          <div className="rounded-md border border-border/60 p-3 text-sm">
            <span className="font-medium">Processing Status:</span> {status}
            {selectedFile ? (
              <span className="ml-2 text-muted-foreground">({selectedFile.name})</span>
            ) : null}
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Processed Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.processed_video ? (
              <video src={result.processed_video} controls className="w-full rounded-md border border-border/60" />
            ) : null}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Detection Summary</h3>
              {result.detections.map((det) => (
                <ConfidenceMeter
                  key={`${det.class}-${det.confidence}`}
                  label={det.class}
                  confidence={det.confidence}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

"use client";

import { useRef } from "react";
import { ImagePlus, UploadCloud, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  accept: string;
  label: string;
  onFileSelect: (file: File) => void;
  className?: string;
  type?: "image" | "video";
}

export function UploadZone({
  accept,
  label,
  onFileSelect,
  className,
  type = "image",
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
          onFileSelect(file);
        }
      }}
      className={cn(
        "rounded-xl border border-dashed border-border bg-card/60 p-8 text-center",
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        {type === "video" ? <Video className="h-6 w-6" /> : <ImagePlus className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold">{label}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Drag and drop here or click browse to select file.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelect(file);
          }
        }}
      />

      <Button
        type="button"
        className="mt-5"
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud className="h-4 w-4" />
        Browse Files
      </Button>
    </div>
  );
}

import type { AnalyticsResponse, DetectionResponse, HistoryRecord } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const predictUrl = `${API_BASE_URL}/predict/`;
const annotatedUrl = `${API_BASE_URL}/predict-annotated/`;

export async function detectImage(file: File): Promise<DetectionResponse> {
  // predict-annotated returns detections + drawn image in a single call
  return postDetectionFile(annotatedUrl, file, "image");
}

export async function detectVideo(file: File): Promise<DetectionResponse> {
  return postDetectionFile(annotatedUrl, file, "video");
}

export async function fetchHistory(): Promise<HistoryRecord[]> {
  const res = await fetch(`${API_BASE_URL}/history`);
  if (!res.ok) throw new Error(`Failed to load history (${res.status}).`);
  return res.json() as Promise<HistoryRecord[]>;
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const res = await fetch(`${API_BASE_URL}/analytics`);
  if (!res.ok) throw new Error(`Failed to load analytics (${res.status}).`);
  return res.json() as Promise<AnalyticsResponse>;
}

export const apiRoutes = {
  detectImage: predictUrl,
  detectAnnotated: annotatedUrl,
  detectVideo: predictUrl,
  history: "/api/history",
  analytics: "/api/analytics",
};

type DetectionMediaType = "image" | "video";
type BackendRecord = Record<string, unknown>;

async function postDetectionFile(
  url: string,
  file: File,
  mediaType: DetectionMediaType
): Promise<DetectionResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getDetectionError(response));
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return normalizeDetectionResponse(await response.json(), mediaType);
  }

  if (contentType.startsWith("image/") || contentType.startsWith("video/")) {
    const objectUrl = URL.createObjectURL(await response.blob());

    return mediaType === "video"
      ? { detections: [], processed_video: objectUrl }
      : { detections: [], processed_image: objectUrl };
  }

  const text = await response.text();

  return normalizeDetectionResponse({ result: text }, mediaType);
}


function normalizeDetectionResponse(data: unknown, mediaType: DetectionMediaType): DetectionResponse {
  if (!isRecord(data)) {
    return { detections: [] };
  }

  const detections = normalizeDetections(
    data.detections ?? data.predictions ?? data.results ?? data.result
  );
  const processed_image = resolveApiUrl(
    getString(data.processed_image) ??
      getString(data.annotated_image) ??
      getString(data.image_url) ??
      getString(data.url)
  );
  const processed_video = resolveApiUrl(
    getString(data.processed_video) ??
      getString(data.annotated_video) ??
      getString(data.video_url)
  );

  return {
    detections,
    processed_image: mediaType === "image" ? processed_image : undefined,
    processed_video: mediaType === "video" ? processed_video : undefined,
  };
}

function normalizeDetections(value: unknown): DetectionResponse["detections"] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (!isRecord(item)) {
        return [];
      }

      const label = getString(item.class_name) ?? getString(item.class) ?? getString(item.label) ?? getString(item.name);
      const confidence = getNumber(item.confidence) ?? getNumber(item.score) ?? getNumber(item.probability);

      return label && confidence !== null ? [{ class: label, confidence: normalizeConfidence(confidence) }] : [];
    });
  }

  if (isRecord(value)) {
    return Object.entries(value).flatMap(([label, confidence]) => {
      const parsedConfidence = getNumber(confidence);

      return parsedConfidence !== null
        ? [{ class: label, confidence: normalizeConfidence(parsedConfidence) }]
        : [];
    });
  }

  return [];
}

function normalizeConfidence(confidence: number) {
  return confidence > 1 ? confidence / 100 : confidence;
}

function resolveApiUrl(value: string | null) {
  if (!value) {
    return undefined;
  }

  // Backend returns annotated_image as a raw base64 string, not a URL
  if (!value.startsWith("http") && !value.startsWith("/") && !value.startsWith("data:")) {
    return `data:image/jpeg;base64,${value}`;
  }

  try {
    return new URL(value, API_BASE_URL).toString();
  } catch {
    return value;
  }
}

async function getDetectionError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);

    if (isRecord(data)) {
      return getString(data.detail) ?? getString(data.message) ?? `Detection failed (${response.status}).`;
    }
  }

  const text = await response.text().catch(() => "");

  return text || `Detection failed (${response.status}).`;
}

function isRecord(value: unknown): value is BackendRecord {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

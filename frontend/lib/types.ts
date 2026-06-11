export type DamageClass = "pothole" | "crack";

export interface Detection {
  class: string;
  confidence: number;
}

export interface DetectionResponse {
  detections: Detection[];
  processed_image?: string;
  processed_video?: string;
}

export interface HistoryRecord {
  id: string;
  date: string;
  filename: string;
  damageType: DamageClass;
  confidence: number;
  status: "processed" | "failed" | "queued";
}

export interface TrendPoint {
  name: string;
  potholes: number;
  cracks: number;
  accuracy: number;
}

export interface DistributionPoint {
  name: string;
  value: number;
}

export interface AnalyticsResponse {
  trends: TrendPoint[];
  distribution: DistributionPoint[];
  totals: {
    uploads: number;
    detections: number;
    potholes: number;
    cracks: number;
  };
}

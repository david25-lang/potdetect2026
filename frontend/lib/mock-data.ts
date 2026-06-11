import type { AnalyticsResponse, DetectionResponse, HistoryRecord } from "@/lib/types";

export const stats = {
  imagesProcessed: 12840,
  potholesDetected: 3674,
  cracksDetected: 5921,
};

export const recentDetections: HistoryRecord[] = [
  {
    id: "DET-1001",
    date: "2026-06-07T10:12:00.000Z",
    filename: "road_avenue_01.jpg",
    damageType: "pothole",
    confidence: 0.97,
    status: "processed",
  },
  {
    id: "DET-1002",
    date: "2026-06-07T10:45:00.000Z",
    filename: "bridge_lane_04.jpg",
    damageType: "crack",
    confidence: 0.89,
    status: "processed",
  },
  {
    id: "DET-1003",
    date: "2026-06-07T11:10:00.000Z",
    filename: "district_road_12.mp4",
    damageType: "pothole",
    confidence: 0.93,
    status: "queued",
  },
  {
    id: "DET-1004",
    date: "2026-06-07T11:22:00.000Z",
    filename: "arterial_road_08.jpg",
    damageType: "crack",
    confidence: 0.84,
    status: "failed",
  },
  {
    id: "DET-1005",
    date: "2026-06-07T12:02:00.000Z",
    filename: "highway_23.jpg",
    damageType: "pothole",
    confidence: 0.91,
    status: "processed",
  },
];

export const imageDetectionMock: DetectionResponse = {
  detections: [
    { class: "pothole", confidence: 0.97 },
    { class: "crack", confidence: 0.89 },
  ],
  processed_image: "https://images.unsplash.com/photo-1581092334427-9f321d7b2c3b?auto=format&fit=crop&w=1400&q=80",
};

export const videoDetectionMock: DetectionResponse = {
  detections: [
    { class: "pothole", confidence: 0.94 },
    { class: "crack", confidence: 0.87 },
  ],
  processed_video:
    "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
};

export const analyticsMock: AnalyticsResponse = {
  trends: [
    { name: "Jan", potholes: 210, cracks: 390, accuracy: 92 },
    { name: "Feb", potholes: 260, cracks: 420, accuracy: 93 },
    { name: "Mar", potholes: 290, cracks: 470, accuracy: 94 },
    { name: "Apr", potholes: 330, cracks: 510, accuracy: 95 },
    { name: "May", potholes: 310, cracks: 530, accuracy: 94 },
    { name: "Jun", potholes: 360, cracks: 590, accuracy: 96 },
  ],
  distribution: [
    { name: "Potholes", value: 38 },
    { name: "Cracks", value: 62 },
  ],
  totals: {
    uploads: 12840,
    detections: 9595,
    potholes: 3674,
    cracks: 5921,
  },
};

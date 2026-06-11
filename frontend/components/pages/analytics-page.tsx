"use client";

import { useEffect, useState } from "react";

import { fetchAnalytics } from "@/lib/api";
import type { AnalyticsResponse } from "@/lib/types";
import { AnalyticsCharts } from "@/components/common/analytics-charts";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { StatisticsCard } from "@/components/common/statistics-card";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetchAnalytics();
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSpinner label="Loading analytics..." />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-danger">{error ?? "No analytics data available."}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticsCard title="Total Uploads" value={data.totals.uploads.toLocaleString()} change="+12%" />
        <StatisticsCard title="Total Detections" value={data.totals.detections.toLocaleString()} change="+9%" />
        <StatisticsCard title="Potholes" value={data.totals.potholes.toLocaleString()} change="+7%" />
        <StatisticsCard title="Cracks" value={data.totals.cracks.toLocaleString()} change="+11%" />
      </section>
      <AnalyticsCharts data={data} />
    </div>
  );
}

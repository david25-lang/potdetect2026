"use client";

import { useEffect, useState } from "react";

import { fetchAnalytics, fetchHistory } from "@/lib/api";
import type { AnalyticsResponse, HistoryRecord } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";
import { AnalyticsCharts } from "@/components/common/analytics-charts";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { StatisticsCard } from "@/components/common/statistics-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function statusVariant(status: string): "success" | "warning" | "danger" {
  if (status === "processed") return "success";
  if (status === "queued") return "warning";
  return "danger";
}

export function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsData, historyData] = await Promise.all([
          fetchAnalytics(),
          fetchHistory(),
        ]);
        setAnalytics(analyticsData);
        setHistory(historyData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <LoadingSpinner label="Loading dashboard..." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
        {error}
      </p>
    );
  }

  const totals = analytics?.totals ?? { uploads: 0, detections: 0, potholes: 0, cracks: 0 };
  const recent = history.slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticsCard title="Total Uploads" value={totals.uploads.toLocaleString()} />
        <StatisticsCard title="Total Detections" value={totals.detections.toLocaleString()} />
        <StatisticsCard title="Potholes Found" value={totals.potholes.toLocaleString()} />
        <StatisticsCard title="Cracks Found" value={totals.cracks.toLocaleString()} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent Detections</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No detections recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Damage Type</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>{record.filename}</TableCell>
                    <TableCell className="capitalize">{record.damageType}</TableCell>
                    <TableCell>{formatPercent(record.confidence)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(record.status)}>{record.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {analytics ? <AnalyticsCharts data={analytics} /> : null}
    </div>
  );
}

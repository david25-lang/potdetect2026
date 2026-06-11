"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchHistory } from "@/lib/api";
import type { HistoryRecord } from "@/lib/types";
import { formatDate, formatPercent } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pothole" | "crack">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetchHistory();
        setRecords(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to fetch history.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch =
        record.filename.toLowerCase().includes(search.toLowerCase()) ||
        record.id.toLowerCase().includes(search.toLowerCase());

      const matchesFilter = filter === "all" || record.damageType === filter;
      return matchesSearch && matchesFilter;
    });
  }, [records, search, filter]);

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Detection History</CardTitle>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ID or file"
            className="sm:w-64"
          />
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as "all" | "pothole" | "crack")}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Types</option>
            <option value="pothole">Pothole</option>
            <option value="crack">Crack</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <LoadingSpinner label="Loading history..." />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-danger">{error}</p>
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
              {filteredRecords.map((record) => (
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
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No records found for this search/filter.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

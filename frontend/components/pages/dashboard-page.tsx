import { analyticsMock, recentDetections } from "@/lib/mock-data";
import { formatDate, formatPercent } from "@/lib/utils";
import { AnalyticsCharts } from "@/components/common/analytics-charts";
import { StatisticsCard } from "@/components/common/statistics-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const totals = analyticsMock.totals;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticsCard title="Total Uploads" value={totals.uploads.toLocaleString()} change="+12%" />
        <StatisticsCard title="Total Detections" value={totals.detections.toLocaleString()} change="+9%" />
        <StatisticsCard title="Potholes Found" value={totals.potholes.toLocaleString()} change="+7%" />
        <StatisticsCard title="Cracks Found" value={totals.cracks.toLocaleString()} change="+11%" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent Detections</CardTitle>
        </CardHeader>
        <CardContent>
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
              {recentDetections.slice(0, 5).map((record) => (
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
        </CardContent>
      </Card>

      <AnalyticsCharts data={analyticsMock} />
    </div>
  );
}

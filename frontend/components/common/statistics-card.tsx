import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatisticsCardProps {
  title: string;
  value: string;
  change?: string;
}

export function StatisticsCard({ title, value, change }: StatisticsCardProps) {
  return (
    <Card className="bg-card/90">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {change ? (
            <span className="flex items-center gap-1 text-xs font-medium text-success">
              <ArrowUpRight className="h-3 w-3" />
              {change}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoRetry, setAutoRetry] = useState(true);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage how road safety alerts are delivered.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between rounded-md border border-border/60 p-3 text-sm">
            Email Alerts
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(event) => setEmailAlerts(event.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between rounded-md border border-border/60 p-3 text-sm">
            Auto Retry Failed Jobs
            <input
              type="checkbox"
              checked={autoRetry}
              onChange={(event) => setAutoRetry(event.target.checked)}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model Integration</CardTitle>
          <CardDescription>FastAPI endpoint configuration preview.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="rounded-md bg-muted p-2">POST /api/detect-image</p>
          <p className="rounded-md bg-muted p-2">POST /api/detect-video</p>
          <p className="rounded-md bg-muted p-2">GET /api/history</p>
          <p className="rounded-md bg-muted p-2">GET /api/analytics</p>
          <Button className="mt-2">Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}

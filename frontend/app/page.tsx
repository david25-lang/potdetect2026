"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { fetchAnalytics } from "@/lib/api";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [totals, setTotals] = useState({ uploads: 0, potholes: 0, cracks: 0 });

  useEffect(() => {
    fetchAnalytics()
      .then((data) => setTotals(data.totals))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              Smart City Infrastructure AI
            </p>
            <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
              Road Damage Detection System
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              AI-powered pothole and crack detection for municipal maintenance teams,
              civil engineers, and mobility agencies.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/test-model">
                <Button size="lg">Upload Image</Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  Live Demo
                </Button>
              </Link>
            </div>
          </div>

          <Card className="border-border/80 bg-card/85 backdrop-blur">
            <CardHeader>
              <CardTitle>Live Inference Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg border border-border/70 bg-secondary/30 p-4">
                <p className="font-semibold text-primary">Model: YOLOv8</p>
                <p className="mt-1 text-muted-foreground">Latency: 41ms per frame</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-secondary/30 p-4">
                <p className="font-semibold text-warning">Current Alert Density</p>
                <p className="mt-1 text-muted-foreground">Moderate activity in Sector B4</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold">Features</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {["Pothole Detection", "Crack Detection", "Severity Analysis", "Real-Time Processing"].map(
              (feature) => (
                <Card key={feature}>
                  <CardContent className="pt-6">
                    <p className="font-semibold">{feature}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Built for reliable infrastructure condition monitoring.
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-6 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold">Statistics</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Images Processed</p>
                <p className="mt-2 text-3xl font-semibold">{totals.uploads.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Potholes Detected</p>
                <p className="mt-2 text-3xl font-semibold text-warning">
                  {totals.potholes.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Cracks Detected</p>
                <p className="mt-2 text-3xl font-semibold text-danger">
                  {totals.cracks.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-2 px-4 text-sm text-muted-foreground sm:px-6 sm:flex-row lg:px-8">
          <p>Road Damage Detection System</p>
          <p>Designed for modern civil engineering operations.</p>
        </div>
      </footer>
    </div>
  );
}

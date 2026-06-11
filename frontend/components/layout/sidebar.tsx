"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BrainCircuit,
  Clock3,
  FlaskConical,
  GaugeCircle,
  GitCompareArrows,
  LayoutDashboard,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "YOLO Detection", href: "/test-model", icon: FlaskConical },
  { label: "CNN Classification", href: "/classification", icon: BrainCircuit },
  { label: "Compare Models", href: "/compare", icon: GitCompareArrows },
  { label: "Detection History", href: "/history", icon: Clock3 },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-border/60 bg-card/70 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:w-64 md:border-b-0 md:border-r">
      <nav className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 md:grid-cols-1 md:p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden p-4 md:block">
        <div className="rounded-lg border border-border/80 bg-gradient-to-br from-primary/15 to-warning/15 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <GaugeCircle className="h-4 w-4 text-primary" />
            System Health
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Inference Pipeline: Stable</p>
        </div>
      </div>
    </aside>
  );
}

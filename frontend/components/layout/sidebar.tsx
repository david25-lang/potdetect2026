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

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const navContent = (
    <>
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-lg border border-border/80 bg-gradient-to-br from-primary/15 to-warning/15 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <GaugeCircle className="h-4 w-4 text-primary" />
            System Health
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Inference Pipeline: Stable</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r border-border/60 bg-card transition-transform duration-200 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-border/60 bg-card/70 md:block">
        {navContent}
      </aside>
    </>
  );
}

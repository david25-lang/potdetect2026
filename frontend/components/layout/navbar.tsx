"use client";

import Link from "next/link";
import { Building2, Menu, MoonStar, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const subscribeToClientSnapshot = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function Navbar({
  menuOpen,
  onMenuToggle,
}: {
  menuOpen?: boolean;
  onMenuToggle?: () => void;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToClientSnapshot,
    getClientSnapshot,
    getServerSnapshot
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {/* Hamburger — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="md:hidden"
            onClick={onMenuToggle}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Road Damage Detection</p>
              <p className="hidden text-xs text-muted-foreground sm:block">Smart City Vision</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="hidden md:inline-flex">
            <Button variant="outline" size="sm">
              Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {!mounted ? (
              <span className="h-4 w-4" aria-hidden="true" />
            ) : resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <MoonStar className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

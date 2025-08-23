"use client";

import { GitBranch } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b px-8 lg:px-0 supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <div className="flex items-center">
          <GitBranch className="mr-2 h-6 w-6" />
          <span className="font-bold">Synthora</span>
        </div>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground/80"
          >
            Dashboard
          </Link>
          <Link
            href="/timeline"
            className="transition-colors hover:text-foreground/80"
          >
            Timeline
          </Link>
          <Link
            href="/hotspots"
            className="transition-colors hover:text-foreground/80"
          >
            Hotspots
          </Link>
          <Link
            href="/search"
            className="transition-colors hover:text-foreground/80"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}

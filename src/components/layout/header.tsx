'use client'

import { GitBranch } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <GitBranch className="mr-2 h-6 w-6" />
          <span className="font-bold">Synthora</span>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <a href="/dashboard" className="transition-colors hover:text-foreground/80">
              Dashboard
            </a>
            <a href="/timeline" className="transition-colors hover:text-foreground/80">
              Timeline
            </a>
            <a href="/hotspots" className="transition-colors hover:text-foreground/80">
              Hotspots
            </a>
            <a href="/search" className="transition-colors hover:text-foreground/80">
              Search
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
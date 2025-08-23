"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
  className?: string
}

export function AuthLayout({ children, title, description, className }: AuthLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4",
      className
    )}>
      <div className="w-full max-w-md space-y-6">
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
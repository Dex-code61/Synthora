"use client";

import Link from "next/link";
import { CheckCircle, GitBranch, BarChart3, Users, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function WelcomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        {/* Welcome Header */}
        <div className="space-y-6 mt-12">
          <div className="flex items-center justify-center">
            <div className="bg-green-500/30 dark:bg-green-900/20 p-4 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Welcome to Synthora{user?.name ? `, ${user.name}` : ""}!
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              You're all set! Let's explore what you can do with AI-powered Git
              repository analysis.
            </p>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8">
          <div className="space-y-4">
            <div className="flex justify-center">
              <GitBranch className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Repository Analysis</h3>
            <p className="text-muted-foreground text-sm">
              Deep insights into your Git repositories with AI-powered analysis
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <BarChart3 className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Smart Metrics</h3>
            <p className="text-muted-foreground text-sm">
              Comprehensive metrics and visualizations for better decisions
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Team Insights</h3>
            <p className="text-muted-foreground text-sm">
              Understand team productivity and collaboration patterns
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <Zap className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Automated Reports</h3>
            <p className="text-muted-foreground text-sm">
              Get automated insights and recommendations for your projects
            </p>
          </div>
        </div>

        {/* Getting Started Steps */}
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold">
            Ready to get started?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold">Connect Repositories</h3>
              <p className="text-muted-foreground">
                Add your GitHub repositories to start analyzing your codebase
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold">Analyze Code</h3>
              <p className="text-muted-foreground">
                Let our AI analyze your code patterns and generate insights
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xl font-bold mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold">Get Insights</h3>
              <p className="text-muted-foreground">
                Discover hotspots, trends, and actionable recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Action Links */}
        <div className="space-y-6 pt-8">
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
            >
              Go to Dashboard →
            </Link>
            <span className="text-muted-foreground">or</span>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Learn more about Synthora
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            Need help? Check out our{" "}
            <Link
              href="/docs"
              className="text-primary hover:text-primary/80 underline underline-offset-4"
            >
              documentation
            </Link>{" "}
            or{" "}
            <Link
              href="/support"
              className="text-primary hover:text-primary/80 underline underline-offset-4"
            >
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

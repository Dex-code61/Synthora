import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GitBranch, BarChart3, Users, Zap, ArrowRight } from "lucide-react"
import { FaGithub } from "react-icons/fa"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Synthora
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered Git repository analysis and insights
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Transform your development workflow with intelligent code analysis, 
              automated insights, and comprehensive repository metrics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/signin">
                <FaGithub className="mr-2 h-5 w-5" />
                Get Started with GitHub
              </Link>
            </Button>
            {/* <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link href="#features">
                Learn More
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button> */}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to understand and optimize your codebase
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <GitBranch className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Repository Analysis</CardTitle>
              <CardDescription>
                Deep insights into your Git repositories with AI-powered analysis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Smart Metrics</CardTitle>
              <CardDescription>
                Comprehensive metrics and visualizations for better decision making
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Team Insights</CardTitle>
              <CardDescription>
                Understand team productivity and collaboration patterns
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Automated Reports</CardTitle>
              <CardDescription>
                Get automated insights and recommendations for your projects
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes with our simple three-step process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto">
              1
            </div>
            <h3 className="text-xl font-semibold">Connect GitHub</h3>
            <p className="text-muted-foreground">
              Sign in with your GitHub account to access your repositories
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto">
              2
            </div>
            <h3 className="text-xl font-semibold">Select Repository</h3>
            <p className="text-muted-foreground">
              Choose the repository you want to analyze and get insights from
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto">
              3
            </div>
            <h3 className="text-xl font-semibold">Get Insights</h3>
            <p className="text-muted-foreground">
              Receive AI-powered analysis and actionable insights for your code
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Transform Your Development Workflow?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join developers who are already using Synthora to gain deeper insights into their code.
          </p>
          <Button asChild size="lg">
            <Link href="/auth/signin">
              <FaGithub className="mr-2 h-5 w-5" />
              Start Analyzing Now
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
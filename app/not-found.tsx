import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground">404</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline">
                  <Link href="javascript:history.back()">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </Button>
              </div>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                If you believe this is an error, please{" "}
                <a 
                  href="mailto:support@synthora.com" 
                  className="text-primary hover:underline"
                >
                  contact support
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
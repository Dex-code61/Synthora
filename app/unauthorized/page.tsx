import Link from "next/link"
import { Shield, Home, LogIn } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className="bg-orange-100 dark:bg-orange-900/20 p-6 rounded-full">
            <Shield className="h-20 w-20 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Access Denied
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            You don't have permission to access this resource. Please sign in with the appropriate account.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-6 pt-8">
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              href="/auth/signin" 
              className="text-lg font-semibold text-primary hover:text-primary/80 transition-colors underline underline-offset-4 flex items-center gap-2"
            >
              <LogIn className="h-5 w-5" />
              Sign In
            </Link>
            <span className="text-muted-foreground">or</span>
            <Link 
              href="/" 
              className="text-lg text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 flex items-center gap-2"
            >
              <Home className="h-5 w-5" />
              Go Home
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please{" "}
            <Link href="/support" className="text-primary hover:text-primary/80 underline underline-offset-4">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
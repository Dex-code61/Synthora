import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/settings",
  "/repositories",
  "/api/protected"
]

// Define auth routes that should redirect authenticated users
const AUTH_ROUTES = [
  "/auth/signin",
  "/auth/signup"
]

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth/callback",
  "/auth/error",
  "/unauthorized",
  "/api/auth"
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and API routes (except protected ones)
  if (
    pathname.startsWith("/_ next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    (pathname.startsWith("/api") && !pathname.startsWith("/api/protected"))
  ) {
    return NextResponse.next()
  }

  try {
    // Get session using better-auth

    const isAuthenticated = !!(request.cookies.get('better-auth.session_token'))
    const isProtectedRoute = PROTECTED_ROUTES.some(route => 
      pathname.startsWith(route)
    )
    const isAuthRoute = AUTH_ROUTES.some(route => 
      pathname.startsWith(route)
    )
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname === route || pathname.startsWith(route)
    )

    // Allow access to public routes without authentication
    if (isPublicRoute) {
      return NextResponse.next()
    }

    // Handle protected routes
    if (isProtectedRoute && !isAuthenticated) {
      const signInUrl = new URL("/auth/signin", request.url)
      return NextResponse.redirect(signInUrl)
    }

    // Handle auth routes - redirect authenticated users to dashboard
    if (isAuthRoute && isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    
    // If there's an error getting the session and it's a protected route,
    // redirect to sign-in
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      const signInUrl = new URL("/auth/signin", request.url)
      signInUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(signInUrl)
    }
    
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
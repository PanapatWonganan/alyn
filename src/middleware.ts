import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/jwt";

// Routes that require authentication
const protectedRoutes = ["/library", "/wallet", "/write", "/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Try to get NextAuth token first (cookie-based, for web)
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // If we have a valid NextAuth token, proceed with existing logic
  if (token) {
    // Check admin role for admin routes
    if (pathname.startsWith("/admin")) {
      const role = token.role as string | undefined;
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  // If no NextAuth token, check for Bearer token (for API routes only)
  // Page routes should NOT accept Bearer tokens - they need cookies for proper SSR
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    // Bearer tokens are only valid for API requests, not page routes
    // If someone tries to access page routes with Bearer token, redirect to login
    const isPageRoute = !pathname.startsWith("/api");

    if (isPageRoute) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For API routes, verify the Bearer token
    const bearerToken = authorization.slice(7);
    const payload = await verifyToken(bearerToken);

    if (payload && payload.type === "access") {
      // Valid Bearer token for API route
      // Check admin role for admin API routes
      if (pathname.startsWith("/admin")) {
        if (payload.role !== "ADMIN") {
          return NextResponse.json(
            { error: "ไม่มีสิทธิ์เข้าถึง", code: "FORBIDDEN" },
            { status: 403 }
          );
        }
      }
      return NextResponse.next();
    }
  }

  // No valid authentication found
  // For page routes, redirect to login
  // For API routes, this will be handled by the route handlers (they use requireAuth)
  if (!pathname.startsWith("/api")) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/wallet/:path*", "/write/:path*", "/admin/:path*"],
};

import { auth } from "@/auth";

// Force Node.js runtime to support crypto module
export const runtime = 'nodejs';

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isAdmin = req.auth?.user?.role === "ADMIN";
    const { nextUrl } = req;

    // Protected routes
    const protectedPaths = ["/dashboard", "/portfolio", "/transactions", "/settings"];
    const isProtectedRoute = protectedPaths.some(path => nextUrl.pathname.startsWith(path));

    // Admin-only routes
    const adminPaths = ["/admin", "/members"];
    const isAdminRoute = adminPaths.some(path => nextUrl.pathname.startsWith(path));

    // Auth routes (login, signup)
    const authPaths = ["/login", "/signup"];
    const isAuthRoute = authPaths.some(path => nextUrl.pathname.startsWith(path));

    // Redirect logged-in users away from auth pages
    if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
    }

    // Redirect non-logged-in users to login
    if (isProtectedRoute && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
    }

    // Redirect non-admin users away from admin pages
    if (isAdminRoute && !isAdmin) {
        return Response.redirect(new URL("/dashboard", nextUrl));
    }

    return;
});

export const config = {
    matcher: [
        // Match all routes except static files and API routes
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};

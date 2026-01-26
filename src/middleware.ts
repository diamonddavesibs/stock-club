import { auth } from "@/auth";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;

    // Protected routes
    const protectedPaths = ["/dashboard", "/portfolio", "/transactions", "/members", "/settings"];
    const isProtectedRoute = protectedPaths.some(path => nextUrl.pathname.startsWith(path));

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

    return;
});

export const config = {
    matcher: [
        // Match all routes except static files and API routes
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};

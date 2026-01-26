import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// This is a demo configuration with credentials provider
// In production, you would connect to a real database
export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // TODO: Replace with actual database lookup
                // This is a demo implementation
                const validUsers = [
                    { id: "1", email: "member@dfdii.com", password: "password123", name: "Club Member", role: "member" },
                    { id: "2", email: "admin@dfdii.com", password: "admin123", name: "Club Admin", role: "admin" },
                ];

                const user = validUsers.find(
                    (u) => u.email === credentials?.email && u.password === credentials?.password
                );

                if (user) {
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                }

                return null;
            },
        }),
    ],
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string;
                session.user.role = token.role as string;
            }
            return session;
        },
        async authorized({ auth, request }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard") ||
                request.nextUrl.pathname.startsWith("/portfolio") ||
                request.nextUrl.pathname.startsWith("/transactions") ||
                request.nextUrl.pathname.startsWith("/members") ||
                request.nextUrl.pathname.startsWith("/settings");

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect to login
            }

            return true;
        },
    },
    session: {
        strategy: "jwt",
    },
});

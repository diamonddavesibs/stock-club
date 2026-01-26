import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Convert email to lowercase for case-insensitive login
                const email = (credentials.email as string).toLowerCase().trim();

                const user = await prisma.user.findUnique({
                    where: { email },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        password: true,
                        role: true,
                    },
                });

                if (!user) {
                    return null;
                }

                const isValidPassword = await verifyPassword(
                    credentials.password as string,
                    user.password
                );

                if (!isValidPassword) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
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
            const pathname = request.nextUrl.pathname;

            // Admin routes - require admin role
            if (pathname.startsWith("/admin")) {
                if (!isLoggedIn) return false;
                if (auth.user?.role !== "ADMIN") {
                    return Response.redirect(new URL("/dashboard", request.nextUrl));
                }
                return true;
            }

            // Protected dashboard routes
            const isOnDashboard = pathname.startsWith("/dashboard") ||
                pathname.startsWith("/portfolio") ||
                pathname.startsWith("/transactions") ||
                pathname.startsWith("/members") ||
                pathname.startsWith("/settings");

            if (isOnDashboard) {
                return isLoggedIn;
            }

            return true;
        },
    },
    session: {
        strategy: "jwt",
    },
});

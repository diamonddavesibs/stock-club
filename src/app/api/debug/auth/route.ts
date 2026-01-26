import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

// Debug endpoint to test auth
export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // Find user
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
            return NextResponse.json({
                success: false,
                message: "User not found in database",
                email: email
            });
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password);

        return NextResponse.json({
            success: isValidPassword,
            message: isValidPassword ? "Password matches!" : "Password does not match",
            userFound: true,
            userEmail: user.email,
            userName: user.name,
            userRole: user.role,
            passwordChecked: true
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: String(error)
        }, { status: 500 });
    }
}

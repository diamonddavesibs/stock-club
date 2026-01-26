import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ valid: false, error: "Token is required" });
        }

        // Check if token exists and is not expired
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetExpiry: {
                    gt: new Date(),
                },
            },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ valid: false, error: "Invalid or expired token" });
        }

        return NextResponse.json({ valid: true });
    } catch (error) {
        console.error("Failed to verify reset token:", error);
        return NextResponse.json({ valid: false, error: "Failed to verify token" });
    }
}

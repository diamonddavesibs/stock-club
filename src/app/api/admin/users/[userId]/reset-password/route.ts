import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateResetToken, PASSWORD_RESET_EXPIRY_HOURS } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/email";

// POST send password reset email (admin only)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { userId } = await params;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Generate reset token
        const resetToken = generateResetToken();
        const resetExpiry = new Date();
        resetExpiry.setHours(resetExpiry.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

        // Update user with reset token
        await prisma.user.update({
            where: { id: userId },
            data: {
                resetToken,
                resetExpiry,
            },
        });

        // Send reset email
        await sendPasswordResetEmail(user.email, user.name, resetToken);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to send reset email:", error);
        return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResetToken, PASSWORD_RESET_EXPIRY_HOURS } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true, email: true, name: true },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({ success: true });
        }

        // Generate reset token
        const resetToken = generateResetToken();
        const resetExpiry = new Date();
        resetExpiry.setHours(resetExpiry.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

        // Update user with reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetExpiry,
            },
        });

        // Send reset email
        await sendPasswordResetEmail(user.email, user.name, resetToken);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to process forgot password:", error);
        return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
    }
}

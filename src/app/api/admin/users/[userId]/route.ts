import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE user (admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { userId } = await params;

        // Prevent admin from deleting themselves
        if (session.user.id === userId) {
            return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
        }

        // Delete user (cascade will handle portfolio data)
        await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete user:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}

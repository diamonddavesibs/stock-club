import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "MANAGER", "MEMBER"] as const;

// PATCH user role (admin only)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { userId } = await params;
        const { role } = await request.json();

        if (!ALLOWED_ROLES.includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        if (session.user.id === userId && role !== "ADMIN") {
            return NextResponse.json({ error: "Cannot remove your own admin role" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                role: true,
            },
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Failed to update user role:", error);
        return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
    }
}

// DELETE user (admin only)
export async function DELETE(
    request: Request,
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

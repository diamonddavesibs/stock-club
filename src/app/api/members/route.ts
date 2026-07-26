import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/members
 *
 * Names only -- deliberately does NOT return email addresses, so any
 * authenticated member can call it without exposing contact details.
 * Used by the Member Equity page to reconcile spreadsheet rows against
 * real accounts.
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const members = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({ members });
    } catch (error) {
        console.error("Failed to fetch members:", error);
        return NextResponse.json(
            { error: "Failed to fetch members" },
            { status: 500 }
        );
    }
}

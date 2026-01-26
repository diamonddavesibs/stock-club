import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { savePortfolioData } from "@/lib/storage";

// POST save portfolio data for current user
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const portfolioData = await request.json();

        await savePortfolioData(session.user.id, portfolioData);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save portfolio:", error);
        return NextResponse.json({ error: "Failed to save portfolio data" }, { status: 500 });
    }
}

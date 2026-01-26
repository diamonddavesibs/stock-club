import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadPortfolioData } from "@/lib/storage";

// GET portfolio data for current user
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const portfolioData = await loadPortfolioData(session.user.id);

        return NextResponse.json({ portfolio: portfolioData });
    } catch (error) {
        console.error("Failed to load portfolio:", error);
        return NextResponse.json({ error: "Failed to load portfolio data" }, { status: 500 });
    }
}

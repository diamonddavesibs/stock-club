import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStockDetails } from "@/lib/finnhub";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get("symbol");

        if (!symbol) {
            return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
        }

        const details = await getStockDetails(symbol.toUpperCase());

        if (!details) {
            return NextResponse.json({ error: "No data found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, details });
    } catch (error) {
        console.error("Failed to fetch stock details:", error);
        return NextResponse.json({ error: "Failed to fetch stock details" }, { status: 500 });
    }
}

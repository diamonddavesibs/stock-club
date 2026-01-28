import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStockCandles } from "@/lib/finnhub";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get("symbol");
        const range = searchParams.get("range") || "1M";

        if (!symbol) {
            return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
        }

        const candles = await getStockCandles(symbol.toUpperCase(), range);

        return NextResponse.json({ success: true, candles, symbol: symbol.toUpperCase(), range });
    } catch (error) {
        console.error("Failed to fetch stock candles:", error);
        return NextResponse.json({ error: "Failed to fetch stock data" }, { status: 500 });
    }
}

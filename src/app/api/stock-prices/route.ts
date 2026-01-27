import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMultipleQuotes, isFinnhubConfigured, StockQuote } from "@/lib/finnhub";

export async function POST(request: NextRequest) {
    try {
        // Verify user is authenticated
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if Finnhub is configured
        if (!isFinnhubConfigured()) {
            return NextResponse.json(
                { error: "Stock price API not configured", configured: false },
                { status: 503 }
            );
        }

        const { symbols } = await request.json();

        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
            return NextResponse.json(
                { error: "symbols array is required" },
                { status: 400 }
            );
        }

        // Limit to 50 symbols per request to prevent abuse
        const limitedSymbols = symbols.slice(0, 50);

        // Fetch quotes from Finnhub
        const quotesMap = await getMultipleQuotes(limitedSymbols);

        // Convert Map to object for JSON response
        const quotes: Record<string, StockQuote> = {};
        quotesMap.forEach((quote, symbol) => {
            quotes[symbol] = quote;
        });

        return NextResponse.json({
            success: true,
            quotes,
            timestamp: Date.now(),
            fetchedCount: Object.keys(quotes).length,
            requestedCount: limitedSymbols.length,
        });
    } catch (error) {
        console.error("Failed to fetch stock prices:", error);
        return NextResponse.json(
            { error: "Failed to fetch stock prices" },
            { status: 500 }
        );
    }
}

// GET endpoint to check API status
export async function GET() {
    const configured = isFinnhubConfigured();

    return NextResponse.json({
        configured,
        message: configured
            ? "Finnhub API is configured"
            : "FINNHUB_API_KEY environment variable not set",
    });
}

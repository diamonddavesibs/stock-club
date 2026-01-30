import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchSymbols } from "@/lib/finnhub";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q");

        if (!q || q.trim().length === 0) {
            return NextResponse.json({ results: [] });
        }

        const results = await searchSymbols(q.trim());

        return NextResponse.json({ results });
    } catch (error) {
        console.error("Failed to search stocks:", error);
        return NextResponse.json({ error: "Failed to search stocks" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Debug endpoint to check session data
export async function GET() {
    try {
        const session = await auth();

        return NextResponse.json({
            session: session,
            user: session?.user,
            role: session?.user?.role,
            roleType: typeof session?.user?.role,
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

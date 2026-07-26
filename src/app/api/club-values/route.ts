import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
    DEFAULT_CLUB_VALUES_CSV,
    parseClubValuesCsv,
    canEditClubValues,
} from "@/lib/club-values";

const CLUB_VALUES_KEY = "current";

type ClubValuesSnapshotRecord = {
    csvData: string;
    updatedAt: Date;
    updatedByName: string | null;
};

type ClubValuesSnapshotDelegate = {
    findUnique(args: { where: { key: string } }): Promise<ClubValuesSnapshotRecord | null>;
    upsert(args: {
        where: { key: string };
        create: { key: string; csvData: string; updatedByName: string };
        update: { csvData: string; updatedByName: string };
    }): Promise<ClubValuesSnapshotRecord>;
};

const clubValuesSnapshot = (
    prisma as unknown as { clubValuesSnapshot: ClubValuesSnapshotDelegate }
).clubValuesSnapshot;

function isStorageNotInitializedError(error: unknown): boolean {
    if (!error) return false;
    const message = error instanceof Error ? error.message : String(error);
    return /P2021|does not exist|relation .*ClubValuesSnapshot|clubvaluessnapshot/i.test(message);
}

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let saved: ClubValuesSnapshotRecord | null = null;

        try {
            saved = await clubValuesSnapshot.findUnique({
                where: { key: CLUB_VALUES_KEY },
            });
        } catch (storageError) {
            if (!isStorageNotInitializedError(storageError)) {
                throw storageError;
            }
        }

        const csv = saved?.csvData ?? DEFAULT_CLUB_VALUES_CSV;
        const table = parseClubValuesCsv(csv);

        return NextResponse.json({
            table,
            csv,
            canEdit: canEditClubValues(session.user),
            updatedAt: saved?.updatedAt ?? null,
            updatedBy: saved?.updatedByName ?? null,
        });
    } catch (error) {
        console.error("Failed to load club values:", error);
        return NextResponse.json(
            { error: "Failed to load club values" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!canEditClubValues(session.user)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const csv = typeof body?.csv === "string" ? body.csv.trim() : "";

        if (!csv) {
            return NextResponse.json({ error: "CSV content is required" }, { status: 400 });
        }

        const table = parseClubValuesCsv(csv);

        const saved = await clubValuesSnapshot.upsert({
            where: { key: CLUB_VALUES_KEY },
            create: {
                key: CLUB_VALUES_KEY,
                csvData: csv,
                updatedByName: session.user.name ?? "Unknown",
            },
            update: {
                csvData: csv,
                updatedByName: session.user.name ?? "Unknown",
            },
        });

        return NextResponse.json({
            success: true,
            table,
            csv,
            updatedAt: saved.updatedAt,
            updatedBy: saved.updatedByName,
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes("CSV")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (isStorageNotInitializedError(error)) {
            return NextResponse.json(
                {
                    error: "Club values storage not initialized. Run Prisma migration and redeploy.",
                },
                { status: 503 }
            );
        }

        console.error("Failed to save club values:", error);
        return NextResponse.json(
            { error: "Failed to save club values" },
            { status: 500 }
        );
    }
}

import { normalizeAccountName } from "@/lib/member-equity";
export const DEFAULT_CLUB_VALUES_CSV = `NAME,SHARES,5/31/2026,6/30/2026,7/31/2026,8/31/2026,9/30/2026,10/31/2026,Value,Gain %
COSMO,375.021,"28,525.00","28,625.00","28,725.00","28,825.00","28,925.00","29,025.00","57,183.20",97%
MONTE,370.872,"28,425.00","28,425.00","28,425.00","28,425.00","28,425.00","28,425.00","56,550.56",99%
PAUL,374.990,"28,525.00","28,625.00","28,625.00","28,625.00","28,925.00","29,025.00","57,178.48",97%
JOE R,375.021,"28,525.00","28,625.00","28,725.00","28,825.00","28,925.00","29,025.00","57,183.20",97%
LEN,374.073,"28,525.00","28,625.00","28,725.00","28,725.00","28,925.00","28,925.00","57,038.65",97%
FRANK,375.021,"28,525.00","28,625.00","28,725.00","28,825.00","28,925.00","29,025.00","57,183.20",97%
DAVID,108.422,"10,377.00","10,477.00","10,637.00","10,802.00","10,962.00","11,262.00","16,532.19",47%
JAY,105.740,"10,544.00","10,709.00","10,874.00","11,039.00","11,199.00","11,359.00","16,123.24",42%
JOE M,67.956,"6,996.44","7,161.44","7,326.44","7,491.44","7,651.44","7,811.44","10,361.93",33%
MIKE,61.748,"6,450.00","6,550.00","6,650.00","6,750.00","6,850.00","6,950.00","9,415.33",35%
JIM FLYNN,63.000,"6,550.00","6,650.00","6,750.00","6,850.00","6,950.00","7,050.00","9,606.24",36%
TOMMY,56.334,"5,850.00","5,950.00","6,050.00","6,150.00","6,250.00","6,350.00","8,589.81",35%
CARMINE,28.949,"3,020.00","3,320.00","3,620.00","3,720.00","3,920.00","4,145.00","4,414.14",6%
WILLIAM,22.188,"1,983.88","2,283.88","2,583.88","2,683.88","2,983.88","3,283.88","3,383.23",3%
Robert,10.671,"1,150.00","1,250.00","1,250.00","1,450.00","1,550.00","1,650.00","1,627.11",-1%
TOTAL,"2,770.007","219,821.32","225,901.32","227,691.32","229,186.32","231,366.32","233,311.32","422,370.51",`;

const REQUIRED_HEADERS = ["NAME", "SHARES", "Value", "Gain %"];
const CLUB_VALUES_EDITOR_EMAILS = ["joeymess16@gmail.com"];

export interface ClubValuesTableData {
    headers: string[];
    rows: string[][];
}

function parseCsvLine(line: string): string[] {
    return line
        .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map((cell) => {
            const trimmed = cell.trim();
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                return trimmed.slice(1, -1).replace(/""/g, '"');
            }
            return trimmed;
        });
}

export function parseClubValuesCsv(csv: string): ClubValuesTableData {
    const lines = csv
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 2) {
        throw new Error("CSV must include a header row and at least one data row.");
    }

    const headers = parseCsvLine(lines[0]);

    for (const required of REQUIRED_HEADERS) {
        if (!headers.includes(required)) {
            throw new Error(`CSV is missing required column: ${required}`);
        }
    }

    const rows = lines.slice(1).map((line, index) => {
        const parsed = parseCsvLine(line);
        if (parsed.length !== headers.length) {
            throw new Error(`Row ${index + 2} does not match header column count.`);
        }
        return parsed;
    });

    return { headers, rows };
}

export function canEditClubValues(
    user: { role?: string | null; name?: string | null; email?: string | null } | null | undefined
): boolean {
    if (!user) return false;
    if (user.role === "ADMIN" || user.role === "MANAGER") return true;

    const email = user.email?.trim().toLowerCase();
    return !!email && CLUB_VALUES_EDITOR_EMAILS.includes(email);
}

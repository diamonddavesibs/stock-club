import { normalizeAccountName } from "@/lib/member-equity";
export const DEFAULT_CLUB_VALUES_CSV = `NAME,SHARES,11/30/2025,12/31/2025,1/31/2026,2/28/2026,3/31/2026,4/30/2026,5/31/2026,6/30/2026,Value,Gain %
COSMO,372.498,"27,925.00","27,925.00","28,125.00","28,225.00","28,325.00","28,425.00","28,525.00","28,625.00","57,726.99",102%
MONTE,370.872,"27,825.00","27,825.00","28,025.00","28,125.00","28,225.00","28,325.00","28,425.00","28,425.00","57,474.87",102%
PAUL,372.471,"27,925.00","27,925.00","27,925.00","28,225.00","28,325.00","28,425.00","28,525.00","28,625.00","57,722.72",102%
JOE R,372.498,"27,925.00","27,925.00","28,125.00","28,225.00","28,325.00","28,425.00","28,525.00","28,625.00","57,726.99",102%
LEN,372.170,"27,925.00","27,925.00","28,125.00","28,225.00","28,325.00","28,425.00","28,525.00","28,625.00","57,676.14",101%
FRANK,372.498,"27,925.00","27,925.00","28,125.00","28,225.00","28,325.00","28,425.00","28,525.00","28,625.00","57,726.99",102%
DAVID,103.469,"9,747.00","9,747.00","9,847.00","9,947.00","10,047.00","10,207.00","10,377.00","10,477.00","16,034.80",53%
JAY,101.641,"9,729.00","9,729.00","9,929.00","10,129.00","10,229.00","10,379.00","10,544.00","10,709.00","15,751.59",47%
JOE M,63.857,"6,050.00","6,050.00","6,831.44","6,831.44","6,831.44","6,831.44","6,996.44","7,161.44","9,896.08",38%
MIKE,59.226,"5,950.00","5,950.00","6,150.00","6,150.00","6,250.00","6,450.00","6,450.00","6,550.00","9,178.35",40%
JIM FLYNN,60.478,"5,950.00","5,950.00","6,150.00","6,250.00","6,350.00","6,350.00","6,550.00","6,650.00","9,372.36",41%
TOMMY,53.811,"5,250.00","5,250.00","5,450.00","5,550.00","5,650.00","5,750.00","5,850.00","5,950.00","8,339.23",40%
CARMINE,23.715,"1,850.00","1,850.00","2,050.00","2,150.00","2,350.00","2,720.00","3,020.00","3,320.00","3,675.23",11%
WILLIAM,14.621,,,"1,000.00","1,153.00","1,313.88","1,683.88","1,983.88","2,283.88","2,265.78",-1%
Robert,8.178,550.00,550.00,750.00,850.00,950.00,"1,050.00","1,150.00","1,250.00","1,267.40",1%
TOTAL,"2,722.004","212,526.00","212,526.00","216,607.44","218,260.44","219,821.32","219,821.32","219,821.32","225,901.32","421,835.53",`;

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

/**
 * DFDII Member Equity data.
 *
 * Source: "Member Values" club spreadsheet (scanned PDF), verified against the
 * sheet's own TOTAL row -- share count, total value, and 6 of the 8 monthly
 * contribution columns reconcile to the penny. See RECONCILIATION notes below.
 *
 * ---------------------------------------------------------------------------
 * TREASURER: to update this page each month you only need to edit
 *   1. VALUE_PER_SHARE  and  VALUE_PER_SHARE_AS_OF   (below)
 *   2. each member's `shares` and append one entry to `contributions`
 *   3. add the new month to CONTRIBUTION_MONTHS (same order as `contributions`)
 * Everything else on the page is derived.
 * ---------------------------------------------------------------------------
 */

/**
 * Club value per share, set by the member who tracks dues collected.
 *
 * NOTE: the spreadsheet prints 162.55 but computes each member's value from a
 * higher-precision figure (444,350.75 / 2,733.554 = 162.554224). Using the
 * printed 162.55 here makes the club total come out $11.38 low. Set this to
 * 162.554224 to reconcile the total exactly; 162.55 is kept because it is the
 * number actually published on the statement.
 */
export const VALUE_PER_SHARE = 152.48;

/** Effective date of VALUE_PER_SHARE, as printed on the club statement. */
export const VALUE_PER_SHARE_AS_OF = "11/17/26";

/**
 * Contribution period labels, oldest first. Must stay in the same order and
 * length as each member's `contributions` array.
 */
export const CONTRIBUTION_MONTHS = [
    "12/31/2025",
    "1/31/2026",
    "2/28/2026",
    "3/31/2026",
    "4/30/2026",
    "5/31/2026",
    "6/30/2026",
    "7/31/2026",
    "8/31/2026",
    "9/30/2026",
    "10/31/2026",
] as const;

export interface MemberEquityRecord {
    /** Stable key for React lists and sorting. */
    key: string;
    /** Name exactly as it appears on the club spreadsheet. */
    displayName: string;
    /**
     * Name used to match this row to a User account at runtime. Compared
     * case-insensitively against "<first name> <last initial>" of the account
     * name, then against the first name alone. Keeps the page in sync with the
     * Members list without hardcoding emails.
     */
    matchName: string;
    /** Units of ownership in the club. */
    shares: number;
    /**
     * Cumulative dues contributed as of each month in CONTRIBUTION_MONTHS.
     * `null` means the member had not joined yet that month.
     */
    contributions: (number | null)[];
}

export const memberEquity: MemberEquityRecord[] = [
    { key: "cosmo",     displayName: "Cosimo Cancelliere", matchName: "Cosimo Cancelliere", shares: 375.021, contributions: [27925, 28125, 28225, 28325, 28425, 28525, 28625, 28725, 28825, 28925, 29025] },
    { key: "monte",     displayName: "Monte Cariani",      matchName: "Monte Cariani",      shares: 370.872, contributions: [27825, 28025, 28125, 28225, 28325, 28425, 28425, 28425, 28425, 28425, 28425] },
    { key: "paul",      displayName: "Paul Ciampi",        matchName: "Paul Ciampi",        shares: 374.990, contributions: [27925, 27925, 28225, 28325, 28425, 28525, 28625, 28625, 28625, 28925, 29025] },
    { key: "joe-r",     displayName: "Joe Grot",           matchName: "Joe Grot",           shares: 375.021, contributions: [27925, 28125, 28225, 28325, 28425, 28525, 28625, 28725, 28825, 28925, 29025] },
    { key: "len",       displayName: "Lenny Guancione",    matchName: "Lenny Guancione",    shares: 374.073, contributions: [27925, 28125, 28225, 28325, 28425, 28525, 28625, 28725, 28725, 28925, 28925] },
    { key: "frank",     displayName: "Frank Marshall",     matchName: "Frank Marshall",     shares: 375.021, contributions: [27925, 28125, 28225, 28325, 28425, 28525, 28625, 28725, 28825, 28925, 29025] },
    { key: "david",     displayName: "David Sibilia",      matchName: "David Sibilia",      shares: 108.422, contributions: [9747, 9847, 9947, 10047, 10207, 10377, 10477, 10637, 10802, 10962, 11262] },
    { key: "jay",       displayName: "Jay Messina",        matchName: "Jay Messina",        shares: 105.740, contributions: [9729, 9929, 10129, 10229, 10379, 10544, 10709, 10874, 11039, 11199, 11359] },
    { key: "joe-m",     displayName: "Joe Messina",        matchName: "Joe Messina",        shares: 67.956, contributions: [6050, 6831.44, 6831.44, 6831.44, 6831.44, 6996.44, 7161.44, 7326.44, 7491.44, 7651.44, 7811.44] },
    { key: "mike",      displayName: "Mike Sibilia",       matchName: "Mike Sibilia",       shares: 61.748, contributions: [5950, 6150, 6150, 6250, 6450, 6450, 6550, 6650, 6750, 6850, 6950] },
    { key: "jim-flynn", displayName: "Jimmy Flynn",        matchName: "Jimmy Flynn",        shares: 63.000, contributions: [5950, 6150, 6250, 6350, 6350, 6550, 6650, 6750, 6850, 6950, 7050] },
    { key: "tommy",     displayName: "Tommy Sibilia",      matchName: "Tommy Sibilia",      shares: 56.334, contributions: [5250, 5450, 5550, 5650, 5750, 5850, 5950, 6050, 6150, 6250, 6350] },
    { key: "carmine",   displayName: "Carmine Rubinaccio", matchName: "Carmine Rubinaccio", shares: 28.949, contributions: [1850, 2050, 2150, 2350, 2720, 3020, 3320, 3620, 3720, 3920, 4145] },
    { key: "william",   displayName: "Bill Ilaria",        matchName: "Bill Ilaria",        shares: 22.188, contributions: [null, 1000, 1153, 1313.88, 1683.88, 1983.88, 2283.88, 2583.88, 2683.88, 2983.88, 3283.88] },
    { key: "robert",    displayName: "Robert Sibilia",     matchName: "Robert Sibilia",     shares: 10.671, contributions: [550, 750, 850, 950, 1050, 1150, 1250, 1250, 1450, 1550, 1650] },
];

/**
 * RECONCILIATION against the club spreadsheet's TOTAL row (July 2026 sheet):
 *
 *   Total shares       2,733.555  vs sheet 2,733.554   (0.001 rounding)
 *   Total value      $444,339.37  vs sheet $444,350.75 ($11.38 -- see the
 *                    VALUE_PER_SHARE note above)
 *   12/31, 1/31, 2/28, 3/31 and 6/30 columns  --  exact match
 *   7/31 column      $227,691.32  vs sheet $226,441.32 ($1,250 -- Robert's
 *                    July cell is blank on the sheet, so the sheet's SUM drops
 *                    him entirely. His cumulative total is still $1,250, so
 *                    this page carries it forward. See contributionAt().
 *   4/30 column      $221,871.32  vs sheet $219,821.32
 *   5/31 column      $223,971.32  vs sheet $219,821.32
 *
 * The sheet still prints 219,821.32 for 3/31, 4/30 AND 5/31 -- an un-extended
 * SUM formula in the source workbook, carried over from the June sheet.
 * Individual member rows are correct (they reconcile at 6/30 and 7/31), so this
 * page sums the member rows rather than reusing the sheet's stale totals.
 *
 * KNOWN SHEET BUG -- the printed "Value %" column is one month stale. On the
 * July sheet those percentages divide each member's value by the 6/30 column
 * instead of 7/31 (verified: 15/15 rows match the 6/30 basis, 3/15 match 7/31).
 * The June sheet did NOT have this problem. This page computes the percentage
 * against the latest contribution, so figures here are correct but will read
 * lower than the PDF -- e.g. Carmine 15% here vs 26% printed.
 */

export interface ComputedMemberEquity extends MemberEquityRecord {
    /** Cumulative dues contributed to date. */
    contributed: number;
    /** shares * VALUE_PER_SHARE */
    value: number;
    /** value - contributed */
    gain: number;
    /** gain / contributed */
    gainPercent: number;
    /** shares / total shares */
    ownershipPercent: number;
    /** Index of the first month this member appears, for "joined" labelling. */
    firstMonthIndex: number;
}

/** Most recent non-null contribution figure for a member. */
export function latestContribution(record: MemberEquityRecord): number {
    for (let i = record.contributions.length - 1; i >= 0; i--) {
        const v = record.contributions[i];
        if (v !== null && v !== undefined) return v;
    }
    return 0;
}

/** Derive value, gain and ownership for every member. */
export function computeMemberEquity(
    valuePerShare: number = VALUE_PER_SHARE
): ComputedMemberEquity[] {
    const totalShares = memberEquity.reduce((sum, m) => sum + m.shares, 0);

    return memberEquity.map((m) => {
        const contributed = latestContribution(m);
        const value = m.shares * valuePerShare;
        const gain = value - contributed;
        const firstMonthIndex = m.contributions.findIndex(
            (c) => c !== null && c !== undefined
        );

        return {
            ...m,
            contributed,
            value,
            gain,
            gainPercent: contributed > 0 ? gain / contributed : 0,
            ownershipPercent: totalShares > 0 ? m.shares / totalShares : 0,
            firstMonthIndex: firstMonthIndex === -1 ? 0 : firstMonthIndex,
        };
    });
}

export interface MemberEquityTotals {
    shares: number;
    contributed: number;
    value: number;
    gain: number;
    gainPercent: number;
    memberCount: number;
}

/** Club-wide totals, summed from member rows. */
export function computeTotals(
    rows: ComputedMemberEquity[]
): MemberEquityTotals {
    const shares = rows.reduce((s, m) => s + m.shares, 0);
    const contributed = rows.reduce((s, m) => s + m.contributed, 0);
    const value = rows.reduce((s, m) => s + m.value, 0);
    const gain = value - contributed;

    return {
        shares,
        contributed,
        value,
        gain,
        gainPercent: contributed > 0 ? gain / contributed : 0,
        memberCount: rows.length,
    };
}

/**
 * Contribution figure for a member at month `i`, carrying the last known value
 * forward across blank cells once the member has joined.
 *
 * The club sheet leaves a cell blank when a member adds nothing that month, but
 * the column holds CUMULATIVE dues -- so a blank means "unchanged", not "zero".
 * Blanks BEFORE a member joins are genuinely zero and stay zero.
 */
export function contributionAt(record: MemberEquityRecord, i: number): number {
    let seen = false;
    let last = 0;
    for (let j = 0; j <= i && j < record.contributions.length; j++) {
        const v = record.contributions[j];
        if (v !== null && v !== undefined) {
            seen = true;
            last = v;
        }
    }
    return seen ? last : 0;
}

/** Column totals for the contribution history table. */
export function monthlyTotals(): number[] {
    return CONTRIBUTION_MONTHS.map((_, i) =>
        memberEquity.reduce((sum, m) => sum + contributionAt(m, i), 0)
    );
}

/**
 * Normalise an account name to "<first> <last initial>" so that a User named
 * "Joe Riccardi" matches the spreadsheet row "Joe R".
 */
export function normalizeAccountName(name: string): string[] {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return [];

    const first = parts[0].toLowerCase();
    const forms = new Set<string>([first]);

    if (parts.length > 1) {
        const last = parts[parts.length - 1].toLowerCase();
        forms.add(`${first} ${last[0]}`);
        forms.add(`${first} ${last}`);
    }

    return [...forms];
}

/** True if an account name corresponds to a given equity row. */
export function accountMatchesMember(
    accountName: string,
    record: MemberEquityRecord
): boolean {
    const target = record.matchName.trim().toLowerCase().replace(/\./g, "");
    return normalizeAccountName(accountName).includes(target);
}

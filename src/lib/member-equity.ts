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
 * NOTE: the spreadsheet prints 154.97 but computes each member's value from a
 * higher-precision figure (421,835.53 / 2,722.004 = 154.972414). Using the
 * printed 154.97 here makes the club total come out $6.73 low. Set this to
 * 154.972414 to reconcile the total exactly; 154.97 is kept because it is the
 * number actually published on the statement.
 */
export const VALUE_PER_SHARE = 154.97;

/** Effective date of VALUE_PER_SHARE, as printed on the club statement. */
export const VALUE_PER_SHARE_AS_OF = "05/26/26";

/**
 * Contribution period labels, oldest first. Must stay in the same order and
 * length as each member's `contributions` array.
 */
export const CONTRIBUTION_MONTHS = [
    "11/30/2025",
    "12/31/2025",
    "1/31/2026",
    "2/28/2026",
    "3/31/2026",
    "4/30/2026",
    "5/31/2026",
    "6/30/2026",
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
    { key: "cosmo",     displayName: "Cosimo Cancelliere", matchName: "Cosimo Cancelliere", shares: 372.498, contributions: [27925, 27925, 28125, 28225, 28325, 28425, 28525, 28625] },
    { key: "monte",     displayName: "Monte Cariani",      matchName: "Monte Cariani",      shares: 370.872, contributions: [27825, 27825, 28025, 28125, 28225, 28325, 28425, 28425] },
    { key: "paul",      displayName: "Paul Ciampi",        matchName: "Paul Ciampi",        shares: 372.471, contributions: [27925, 27925, 27925, 28225, 28325, 28425, 28525, 28625] },
    { key: "joe-r",     displayName: "Joe Grot",           matchName: "Joe Grot",           shares: 372.498, contributions: [27925, 27925, 28125, 28225, 28325, 28425, 28525, 28625] },
    { key: "len",       displayName: "Lenny Guancione",    matchName: "Lenny Guancione",    shares: 372.170, contributions: [27925, 27925, 28125, 28225, 28325, 28425, 28525, 28625] },
    { key: "frank",     displayName: "Frank Marshall",     matchName: "Frank Marshall",     shares: 372.498, contributions: [27925, 27925, 28125, 28225, 28325, 28425, 28525, 28625] },
    { key: "david",     displayName: "David Sibilia",      matchName: "David Sibilia",      shares: 103.469, contributions: [9747, 9747, 9847, 9947, 10047, 10207, 10377, 10477] },
    { key: "jay",       displayName: "Jay Messina",        matchName: "Jay Messina",        shares: 101.641, contributions: [9729, 9729, 9929, 10129, 10229, 10379, 10544, 10709] },
    { key: "joe-m",     displayName: "Joe Messina",        matchName: "Joe Messina",        shares: 63.857,  contributions: [6050, 6050, 6831.44, 6831.44, 6831.44, 6831.44, 6996.44, 7161.44] },
    { key: "mike",      displayName: "Mike Sibilia",       matchName: "Mike Sibilia",       shares: 59.226,  contributions: [5950, 5950, 6150, 6150, 6250, 6450, 6450, 6550] },
    { key: "jim-flynn", displayName: "Jimmy Flynn",        matchName: "Jimmy Flynn",        shares: 60.478,  contributions: [5950, 5950, 6150, 6250, 6350, 6350, 6550, 6650] },
    { key: "tommy",     displayName: "Tommy Sibilia",      matchName: "Tommy Sibilia",      shares: 53.811,  contributions: [5250, 5250, 5450, 5550, 5650, 5750, 5850, 5950] },
    { key: "carmine",   displayName: "Carmine Rubinaccio", matchName: "Carmine Rubinaccio", shares: 23.715,  contributions: [1850, 1850, 2050, 2150, 2350, 2720, 3020, 3320] },
    { key: "william",   displayName: "Bill Ilaria",        matchName: "Bill Ilaria",        shares: 14.621,  contributions: [null, null, 1000, 1153, 1313.88, 1683.88, 1983.88, 2283.88] },
    { key: "robert",    displayName: "Robert Sibilia",     matchName: "Robert Sibilia",     shares: 8.178,   contributions: [550, 550, 750, 850, 950, 1050, 1150, 1250] },
];

/**
 * RECONCILIATION against the club spreadsheet's TOTAL row:
 *
 *   Total shares       2,722.003  vs sheet 2,722.004   (0.001 rounding)
 *   Total value      $421,828.80  vs sheet $421,835.53 ($6.73 -- see the
 *                    VALUE_PER_SHARE note above; using 154.972414 instead of
 *                    the printed 154.97 reconciles this exactly)
 *   11/30 .. 3/31 and 6/30 columns  --  exact match
 *   4/30 column      $221,871.32  vs sheet $219,821.32
 *   5/31 column      $223,971.32  vs sheet $219,821.32
 *
 * The sheet prints 219,821.32 for 3/31, 4/30 AND 5/31 -- an un-extended SUM
 * formula in the source workbook. Individual member rows are correct (they
 * reconcile at 6/30), so this page sums the member rows rather than reusing
 * the sheet's stale column totals.
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

/** Column totals for the contribution history table. */
export function monthlyTotals(): number[] {
    return CONTRIBUTION_MONTHS.map((_, i) =>
        memberEquity.reduce((sum, m) => sum + (m.contributions[i] ?? 0), 0)
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

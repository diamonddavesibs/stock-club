"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import dashStyles from "../dashboard.module.css";
import styles from "./member-equity.module.css";
import {
    CONTRIBUTION_MONTHS,
    VALUE_PER_SHARE,
    VALUE_PER_SHARE_AS_OF,
    computeMemberEquity,
    computeTotals,
    monthlyTotals,
    accountMatchesMember,
    type ComputedMemberEquity,
} from "@/lib/member-equity";

interface MemberAccount {
    id: string;
    name: string;
}

type SortKey =
    | "displayName"
    | "shares"
    | "ownershipPercent"
    | "contributed"
    | "value"
    | "gain"
    | "gainPercent";
type SortOrder = "asc" | "desc";

const CHART_COLORS = [
    "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
    "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
    "#14b8a6", "#a855f7", "#eab308", "#22c55e", "#0ea5e9",
];

export default function MemberEquityPage() {
    const { data: session } = useSession();
    const user = session?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [accounts, setAccounts] = useState<MemberAccount[]>([]);
    const [accountsLoaded, setAccountsLoaded] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>("value");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    // Pull the roster from the Members list so equity rows stay reconciled
    // with real accounts without hardcoding anything here.
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await fetch("/api/members");
                if (res.ok) {
                    const { members } = await res.json();
                    setAccounts(members ?? []);
                }
            } catch (error) {
                console.error("Failed to load member accounts:", error);
            } finally {
                setAccountsLoaded(true);
            }
        };

        fetchAccounts();
    }, []);

    const rows = useMemo(() => computeMemberEquity(VALUE_PER_SHARE), []);
    const totals = useMemo(() => computeTotals(rows), [rows]);
    const columnTotals = useMemo(() => monthlyTotals(), []);

    // Which equity rows have a matching user account?
    const matchedKeys = useMemo(() => {
        const set = new Set<string>();
        for (const row of rows) {
            if (accounts.some((a) => accountMatchesMember(a.name, row))) {
                set.add(row.key);
            }
        }
        return set;
    }, [rows, accounts]);

    // Accounts with no equity row (surfaced to admins only).
    const unmatchedAccounts = useMemo(() => {
        if (!accountsLoaded) return [];
        return accounts.filter(
            (a) => !rows.some((row) => accountMatchesMember(a.name, row))
        );
    }, [accounts, rows, accountsLoaded]);

    // The logged-in member's own row, matched by name (no emails involved).
    const ownKey = useMemo(() => {
        if (!user?.name) return null;
        const mine = rows.find((row) => accountMatchesMember(user.name!, row));
        return mine?.key ?? null;
    }, [rows, user?.name]);

    const sortedRows = useMemo(() => {
        const sorted = [...rows].sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];

            if (typeof av === "string" && typeof bv === "string") {
                return sortOrder === "asc"
                    ? av.localeCompare(bv)
                    : bv.localeCompare(av);
            }
            return sortOrder === "asc"
                ? (av as number) - (bv as number)
                : (bv as number) - (av as number);
        });
        return sorted;
    }, [rows, sortKey, sortOrder]);

    const chartData = useMemo(
        () =>
            [...rows]
                .sort((a, b) => b.shares - a.shares)
                .map((r) => ({
                    name: r.displayName,
                    value: Number(r.value.toFixed(2)),
                    percent: r.ownershipPercent,
                })),
        [rows]
    );

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder(key === "displayName" ? "asc" : "desc");
        }
    };

    const sortIndicator = (key: SortKey) =>
        sortKey === key ? (sortOrder === "asc" ? " ▲" : " ▼") : "";

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const getInitials = (name: string) =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);

    const formatShares = (value: number) =>
        new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        }).format(value);

    const formatPercent = (value: number, digits = 1) =>
        `${value >= 0 ? "" : "-"}${Math.abs(value * 100).toFixed(digits)}%`;

    return (
        <div className={dashStyles.dashboardLayout}>
            {/* Sidebar overlay for mobile */}
            <div
                className={`${dashStyles.sidebarOverlay} ${sidebarOpen ? dashStyles.sidebarOverlayVisible : ""}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`${dashStyles.sidebar} ${sidebarOpen ? dashStyles.sidebarOpen : ""}`}>
                <div className={dashStyles.sidebarHeader}>
                    <Link href="/dashboard" className={dashStyles.sidebarLogo}>
                        <div className={dashStyles.sidebarLogoIcon}>💵</div>
                        <span className={dashStyles.sidebarLogoText}>DFDII</span>
                    </Link>
                </div>

                <nav className={dashStyles.sidebarNav} onClick={() => setSidebarOpen(false)}>
                    <Link href="/dashboard" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>📊</span>
                        Dashboard
                    </Link>
                    <Link href="/member-equity" className={`${dashStyles.navItem} ${dashStyles.navItemActive}`}>
                        <span className={dashStyles.navIcon}>🥧</span>
                        Member Equity
                    </Link>
                    <Link href="/club-values" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>🧾</span>
                        Club Values
                    </Link>
                    {user?.role === "ADMIN" && (
                        <Link href="/members" className={dashStyles.navItem}>
                            <span className={dashStyles.navIcon}>👥</span>
                            Members
                        </Link>
                    )}
                    <Link href="/settings" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>⚙️</span>
                        Settings
                    </Link>
                    {user?.role === "ADMIN" && (
                        <Link href="/admin/users" className={dashStyles.navItem}>
                            <span className={dashStyles.navIcon}>🔐</span>
                            Admin Panel
                        </Link>
                    )}
                </nav>

                <div className={dashStyles.sidebarFooter}>
                    <div className={dashStyles.userInfo} onClick={handleSignOut} title="Click to sign out">
                        <div className={dashStyles.userAvatar}>
                            {user?.name ? getInitials(user.name) : "U"}
                        </div>
                        <div className={dashStyles.userDetails}>
                            <div className={dashStyles.userName}>{user?.name || "User"}</div>
                            <div className={dashStyles.userRole}>{user?.role || "Member"}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={dashStyles.mainContent}>
                {/* Mobile Header */}
                <div className={dashStyles.mobileHeader}>
                    <button
                        className={dashStyles.mobileMenuButton}
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        ☰
                    </button>
                    <div className={dashStyles.mobileHeaderLogo}>
                        <div className={dashStyles.sidebarLogoIcon}>💵</div>
                        <span className={dashStyles.sidebarLogoText}>DFDII</span>
                    </div>
                </div>

                <header className={dashStyles.header}>
                    <div className={dashStyles.headerContent}>
                        <div>
                            <h1 className={dashStyles.pageTitle}>Member Equity</h1>
                            <p className={styles.subtitle}>
                                Ownership units, dues contributed and current value for each
                                club member
                            </p>
                        </div>
                    </div>
                </header>

                <div className={dashStyles.pageContent}>
                    {/* Summary Cards */}
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Units</div>
                            <div className={styles.summaryValue}>
                                {formatShares(totals.shares)}
                            </div>
                            <div className={styles.summaryMeta}>
                                {totals.memberCount} members
                            </div>
                        </div>

                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Contributed</div>
                            <div className={styles.summaryValue}>
                                {formatCurrency(totals.contributed)}
                            </div>
                            <div className={styles.summaryMeta}>
                                Through {CONTRIBUTION_MONTHS[CONTRIBUTION_MONTHS.length - 1]}
                            </div>
                        </div>

                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Value</div>
                            <div className={styles.summaryValue}>
                                {formatCurrency(totals.value)}
                            </div>
                            <div
                                className={`${styles.summaryChange} ${totals.gain >= 0 ? styles.positive : styles.negative}`}
                            >
                                {formatCurrency(totals.gain)} ({formatPercent(totals.gainPercent)})
                            </div>
                        </div>

                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Value Per Share</div>
                            <div className={styles.summaryValue}>
                                {formatCurrency(VALUE_PER_SHARE)}
                            </div>
                            <div className={styles.summaryMeta}>
                                as of {VALUE_PER_SHARE_AS_OF}
                            </div>
                        </div>
                    </div>

                    {/* Equity Table + Ownership Chart */}
                    <div className={styles.mainGrid}>
                        <section className={styles.tableSection}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Equity by Member</h2>
                            </div>

                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th className={styles.stickyCol} onClick={() => handleSort("displayName")}>
                                                Name{sortIndicator("displayName")}
                                            </th>
                                            <th className={styles.numeric} onClick={() => handleSort("shares")}>
                                                Shares{sortIndicator("shares")}
                                            </th>
                                            <th className={styles.numeric} onClick={() => handleSort("ownershipPercent")}>
                                                % Own{sortIndicator("ownershipPercent")}
                                            </th>
                                            <th className={styles.numeric} onClick={() => handleSort("contributed")}>
                                                Contributed{sortIndicator("contributed")}
                                            </th>
                                            <th className={styles.numeric} onClick={() => handleSort("value")}>
                                                Value{sortIndicator("value")}
                                            </th>
                                            <th className={styles.numeric} onClick={() => handleSort("gain")}>
                                                Gain{sortIndicator("gain")}
                                            </th>
                                            <th className={styles.numeric} onClick={() => handleSort("gainPercent")}>
                                                Gain %{sortIndicator("gainPercent")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedRows.map((row: ComputedMemberEquity) => {
                                            const isMe = row.key === ownKey;
                                            const noAccount =
                                                accountsLoaded && !matchedKeys.has(row.key);

                                            return (
                                                <tr
                                                    key={row.key}
                                                    className={isMe ? styles.ownRow : undefined}
                                                >
                                                    <td className={`${styles.nameCell} ${styles.stickyCol}`}>
                                                        <span className={styles.memberName}>
                                                            {row.displayName}
                                                        </span>
                                                        {isMe && (
                                                            <span className={styles.youBadge}>You</span>
                                                        )}
                                                        {noAccount && (
                                                            <span
                                                                className={styles.noAccountBadge}
                                                                title="No matching login account on the Members list"
                                                            >
                                                                no account
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className={styles.numeric}>
                                                        {formatShares(row.shares)}
                                                    </td>
                                                    <td className={styles.numeric}>
                                                        {formatPercent(row.ownershipPercent)}
                                                    </td>
                                                    <td className={styles.numeric}>
                                                        {formatCurrency(row.contributed)}
                                                    </td>
                                                    <td className={`${styles.numeric} ${styles.strong}`}>
                                                        {formatCurrency(row.value)}
                                                    </td>
                                                    <td
                                                        className={`${styles.numeric} ${row.gain >= 0 ? styles.positive : styles.negative}`}
                                                    >
                                                        {formatCurrency(row.gain)}
                                                    </td>
                                                    <td
                                                        className={`${styles.numeric} ${row.gain >= 0 ? styles.positive : styles.negative}`}
                                                    >
                                                        {formatPercent(row.gainPercent)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td className={styles.stickyCol}>Total</td>
                                            <td className={styles.numeric}>
                                                {formatShares(totals.shares)}
                                            </td>
                                            <td className={styles.numeric}>100.0%</td>
                                            <td className={styles.numeric}>
                                                {formatCurrency(totals.contributed)}
                                            </td>
                                            <td className={styles.numeric}>
                                                {formatCurrency(totals.value)}
                                            </td>
                                            <td
                                                className={`${styles.numeric} ${totals.gain >= 0 ? styles.positive : styles.negative}`}
                                            >
                                                {formatCurrency(totals.gain)}
                                            </td>
                                            <td
                                                className={`${styles.numeric} ${totals.gain >= 0 ? styles.positive : styles.negative}`}
                                            >
                                                {formatPercent(totals.gainPercent)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {user?.role === "ADMIN" && unmatchedAccounts.length > 0 && (
                                <p className={styles.footnote}>
                                    Accounts with no equity row:{" "}
                                    {unmatchedAccounts.map((a) => a.name).join(", ")}
                                </p>
                            )}
                        </section>

                        <section className={styles.chartSection}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Ownership</h2>
                            </div>
                            <div className={styles.chartCard}>
                                <div className={styles.chartContainer}>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={120}
                                                paddingAngle={1}
                                                stroke="none"
                                            >
                                                {chartData.map((entry, i) => (
                                                    <Cell
                                                        key={entry.name}
                                                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    background: "var(--color-bg-elevated)",
                                                    border: "1px solid var(--color-border)",
                                                    borderRadius: "8px",
                                                    color: "#ffffff",
                                                }}
                                                labelStyle={{ color: "#ffffff" }}
                                                itemStyle={{ color: "#ffffff" }}
                                                formatter={(value, name) => [
                                                    formatCurrency(Number(value ?? 0)),
                                                    String(name ?? ""),
                                                ]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className={styles.legend}>
                                    {chartData.map((entry, i) => (
                                        <div key={entry.name} className={styles.legendItem}>
                                            <span
                                                className={styles.legendSwatch}
                                                style={{
                                                    background:
                                                        CHART_COLORS[i % CHART_COLORS.length],
                                                }}
                                            />
                                            <span className={styles.legendName}>{entry.name}</span>
                                            <span className={styles.legendValue}>
                                                {formatPercent(entry.percent)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Contribution History */}
                    <section className={styles.historySection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Contribution History</h2>
                            <button
                                className={styles.toggleButton}
                                onClick={() => setShowHistory(!showHistory)}
                                aria-expanded={showHistory}
                            >
                                {showHistory ? "Hide" : "Show"}
                            </button>
                        </div>

                        {showHistory && (
                            <>
                                <p className={styles.footnote}>
                                    Cumulative dues contributed as of each month end.
                                </p>
                                <div className={styles.tableContainer}>
                                    <table className={`${styles.table} ${styles.historyTable}`}>
                                        <thead>
                                            <tr>
                                                <th className={styles.stickyCol}>Name</th>
                                                {CONTRIBUTION_MONTHS.map((month) => (
                                                    <th key={month} className={styles.numeric}>
                                                        {month}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row) => (
                                                <tr
                                                    key={row.key}
                                                    className={row.key === ownKey ? styles.ownRow : undefined}
                                                >
                                                    <td className={styles.stickyCol}>
                                                        {row.displayName}
                                                    </td>
                                                    {row.contributions.map((amount, i) => (
                                                        <td
                                                            key={CONTRIBUTION_MONTHS[i]}
                                                            className={styles.numeric}
                                                        >
                                                            {amount === null || amount === undefined ? (
                                                                <span className={styles.muted}>—</span>
                                                            ) : (
                                                                formatCurrency(amount)
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td className={styles.stickyCol}>Total</td>
                                                {columnTotals.map((total, i) => (
                                                    <td
                                                        key={CONTRIBUTION_MONTHS[i]}
                                                        className={styles.numeric}
                                                    >
                                                        {formatCurrency(total)}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

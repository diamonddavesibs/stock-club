"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import dashStyles from "../dashboard.module.css";
import styles from "./transactions.module.css";
import { Transaction } from "@/lib/types";
import { loadPortfolioData, hasPortfolioData } from "@/lib/storage";

// Sample transactions for when no real data is uploaded
const sampleTransactions: Transaction[] = [
    { date: "2024-01-15", action: "BUY", symbol: "AAPL", description: "Apple Inc. - Buy", quantity: 50, price: 145.20, fees: 1.99, amount: -7261.99 },
    { date: "2024-01-10", action: "BUY", symbol: "MSFT", description: "Microsoft Corp. - Buy", quantity: 30, price: 280.00, fees: 1.99, amount: -8401.99 },
    { date: "2024-01-05", action: "DIVIDEND", symbol: "AAPL", description: "Apple Inc. - Dividend", quantity: 0, price: 0, fees: 0, amount: 24.50 },
    { date: "2024-01-03", action: "BUY", symbol: "GOOGL", description: "Alphabet Inc. - Buy", quantity: 15, price: 120.50, fees: 1.99, amount: -1809.49 },
    { date: "2023-12-20", action: "SELL", symbol: "TSLA", description: "Tesla Inc. - Sell", quantity: 8, price: 240.00, fees: 1.99, amount: 1918.01 },
    { date: "2023-12-15", action: "BUY", symbol: "NVDA", description: "NVIDIA Corp. - Buy", quantity: 20, price: 450.00, fees: 1.99, amount: -9001.99 },
    { date: "2023-12-10", action: "DEPOSIT", symbol: "--", description: "Cash Deposit", quantity: 0, price: 0, fees: 0, amount: 5000.00 },
    { date: "2023-12-05", action: "DIVIDEND", symbol: "MSFT", description: "Microsoft Corp. - Dividend", quantity: 0, price: 0, fees: 0, amount: 22.50 },
    { date: "2023-12-01", action: "BUY", symbol: "AMZN", description: "Amazon.com Inc. - Buy", quantity: 25, price: 145.00, fees: 1.99, amount: -3626.99 },
    { date: "2023-11-28", action: "BUY", symbol: "META", description: "Meta Platforms Inc. - Buy", quantity: 18, price: 320.00, fees: 1.99, amount: -5761.99 },
];

type SortKey = "date" | "action" | "symbol" | "quantity" | "price" | "amount";
type SortOrder = "asc" | "desc";

export default function TransactionsPage() {
    const { data: session } = useSession();
    const user = session?.user;
    const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions);
    const [hasRealData, setHasRealData] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterAction, setFilterAction] = useState<string>("ALL");
    const [sortKey, setSortKey] = useState<SortKey>("date");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    useEffect(() => {
        if (hasPortfolioData()) {
            const data = loadPortfolioData();
            if (data.transactions.length > 0) {
                setTransactions(data.transactions);
                setHasRealData(true);
            }
        }
    }, []);

    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    };

    // Filter and sort transactions
    const filteredAndSortedTransactions = useMemo(() => {
        let filtered = transactions;

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = transactions.filter(
                (t) =>
                    t.symbol.toLowerCase().includes(query) ||
                    t.description.toLowerCase().includes(query)
            );
        }

        // Apply action filter
        if (filterAction !== "ALL") {
            filtered = filtered.filter((t) => t.action === filterAction);
        }

        // Apply sorting
        return [...filtered].sort((a, b) => {
            let aVal: string | number;
            let bVal: string | number;

            if (sortKey === "date" || sortKey === "symbol" || sortKey === "action") {
                aVal = a[sortKey];
                bVal = b[sortKey];
                if (typeof aVal === "string" && typeof bVal === "string") {
                    return sortOrder === "asc"
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                }
            } else {
                aVal = a[sortKey];
                bVal = b[sortKey];
            }

            return sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        });
    }, [transactions, searchQuery, filterAction, sortKey, sortOrder]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("desc");
        }
    };

    const SortIcon = ({ column }: { column: SortKey }) => {
        const isActive = sortKey === column;
        return (
            <span className={`${styles.sortIndicator} ${isActive ? styles.sortActive : ""}`}>
                {isActive ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
            </span>
        );
    };

    const getActionBadgeClass = (action: Transaction["action"]) => {
        switch (action) {
            case "BUY": return styles.badgeBuy;
            case "SELL": return styles.badgeSell;
            case "DIVIDEND": return styles.badgeDividend;
            case "DEPOSIT": return styles.badgeDeposit;
            case "WITHDRAWAL": return styles.badgeWithdrawal;
            default: return styles.badgeOther;
        }
    };

    // Calculate summary stats
    const totalBuys = transactions.filter(t => t.action === "BUY").reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalSells = transactions.filter(t => t.action === "SELL").reduce((sum, t) => sum + t.amount, 0);
    const totalDividends = transactions.filter(t => t.action === "DIVIDEND").reduce((sum, t) => sum + t.amount, 0);
    const netCashFlow = transactions.reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className={dashStyles.dashboardLayout}>
            {/* Sidebar */}
            <aside className={dashStyles.sidebar}>
                <div className={dashStyles.sidebarHeader}>
                    <Link href="/dashboard" className={dashStyles.sidebarLogo}>
                        <div className={dashStyles.sidebarLogoIcon}>💵</div>
                        <span className={dashStyles.sidebarLogoText}>DFDII</span>
                    </Link>
                </div>

                <nav className={dashStyles.sidebarNav}>
                    <Link href="/dashboard" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>📊</span>
                        Dashboard
                    </Link>
                    <Link href="/portfolio" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>💼</span>
                        Portfolio
                    </Link>
                    <Link href="/transactions" className={`${dashStyles.navItem} ${dashStyles.navItemActive}`}>
                        <span className={dashStyles.navIcon}>📋</span>
                        Transactions
                    </Link>
                    <Link href="/members" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>👥</span>
                        Members
                    </Link>
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
                <header className={dashStyles.header}>
                    <div className={dashStyles.headerContent}>
                        <h1 className={dashStyles.pageTitle}>Transactions</h1>
                        <div className={dashStyles.headerActions}>
                            {hasRealData ? (
                                <span style={{ color: 'var(--color-success)', fontSize: '0.875rem' }}>
                                    ✓ Schwab data loaded
                                </span>
                            ) : (
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                    Sample data
                                </span>
                            )}
                        </div>
                    </div>
                </header>

                <div className={styles.transactionsPage}>
                    {/* Header */}
                    <div className={styles.transactionsHeader}>
                        <h2 className={styles.transactionsTitle}>
                            {filteredAndSortedTransactions.length} Transaction{filteredAndSortedTransactions.length !== 1 ? 's' : ''}
                        </h2>
                        <div className={styles.transactionsActions}>
                            <select
                                className={styles.filterSelect}
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                            >
                                <option value="ALL">All Types</option>
                                <option value="BUY">Buy</option>
                                <option value="SELL">Sell</option>
                                <option value="DIVIDEND">Dividend</option>
                                <option value="DEPOSIT">Deposit</option>
                                <option value="WITHDRAWAL">Withdrawal</option>
                                <option value="OTHER">Other</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                className={styles.searchInput}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Purchases</div>
                            <div className={styles.summaryValue}>{formatCurrency(totalBuys)}</div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Sales</div>
                            <div className={styles.summaryValue}>{formatCurrency(totalSells)}</div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Dividends</div>
                            <div className={styles.summaryValue} style={{ color: 'var(--color-success)' }}>
                                {formatCurrency(totalDividends)}
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Net Cash Flow</div>
                            <div className={`${styles.summaryValue} ${netCashFlow >= 0 ? styles.positive : styles.negative}`}>
                                {formatCurrency(netCashFlow)}
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className={styles.transactionsCard}>
                        {filteredAndSortedTransactions.length > 0 ? (
                            <div className={styles.tableContainer}>
                                <table className={styles.transactionsTable}>
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort("date")}>
                                                Date <SortIcon column="date" />
                                            </th>
                                            <th onClick={() => handleSort("action")}>
                                                Type <SortIcon column="action" />
                                            </th>
                                            <th onClick={() => handleSort("symbol")}>
                                                Symbol <SortIcon column="symbol" />
                                            </th>
                                            <th>Description</th>
                                            <th onClick={() => handleSort("quantity")}>
                                                Quantity <SortIcon column="quantity" />
                                            </th>
                                            <th onClick={() => handleSort("price")}>
                                                Price <SortIcon column="price" />
                                            </th>
                                            <th>Fees</th>
                                            <th onClick={() => handleSort("amount")}>
                                                Amount <SortIcon column="amount" />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAndSortedTransactions.map((txn, index) => (
                                            <tr key={index}>
                                                <td className={styles.dateCell}>{formatDate(txn.date)}</td>
                                                <td>
                                                    <span className={`${styles.actionBadge} ${getActionBadgeClass(txn.action)}`}>
                                                        {txn.action}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={styles.symbolCell}>
                                                        {txn.symbol !== "--" ? txn.symbol : "—"}
                                                    </span>
                                                </td>
                                                <td className={styles.descriptionCell}>{txn.description}</td>
                                                <td className={styles.numericCell}>
                                                    {txn.quantity > 0 ? txn.quantity.toFixed(2) : "—"}
                                                </td>
                                                <td className={styles.numericCell}>
                                                    {txn.price > 0 ? formatCurrency(txn.price) : "—"}
                                                </td>
                                                <td className={styles.numericCell}>
                                                    {txn.fees > 0 ? formatCurrency(txn.fees) : "—"}
                                                </td>
                                                <td className={`${styles.numericCell} ${txn.amount >= 0 ? styles.positive : styles.negative}`}>
                                                    {formatCurrency(txn.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>🔍</div>
                                <h3 className={styles.emptyTitle}>No transactions found</h3>
                                <p className={styles.emptyText}>
                                    {searchQuery || filterAction !== "ALL"
                                        ? "No transactions match your filters"
                                        : "Upload your Schwab transaction history to see transactions here."}
                                </p>
                                {!hasRealData && (
                                    <Link href="/settings" className="btn btn-primary">
                                        Import Schwab Data
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

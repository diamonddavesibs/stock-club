"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import dashStyles from "../dashboard.module.css";
import styles from "./portfolio.module.css";
import { PortfolioData, Holding } from "@/lib/types";

// Sample data for when no real data is uploaded
const sampleHoldings: Holding[] = [
    { symbol: "AAPL", name: "Apple Inc.", quantity: 50, costPerShare: 145.20, currentPrice: 178.50, marketValue: 8925, gainLoss: 1665, gainLossPercent: 22.9 },
    { symbol: "MSFT", name: "Microsoft Corp.", quantity: 30, costPerShare: 280.00, currentPrice: 378.91, marketValue: 11367.3, gainLoss: 2967.3, gainLossPercent: 35.3 },
    { symbol: "GOOGL", name: "Alphabet Inc.", quantity: 15, costPerShare: 120.50, currentPrice: 141.80, marketValue: 2127, gainLoss: 319.5, gainLossPercent: 17.7 },
    { symbol: "NVDA", name: "NVIDIA Corp.", quantity: 20, costPerShare: 450.00, currentPrice: 875.28, marketValue: 17505.6, gainLoss: 8505.6, gainLossPercent: 94.5 },
    { symbol: "AMZN", name: "Amazon.com Inc.", quantity: 25, costPerShare: 145.00, currentPrice: 178.25, marketValue: 4456.25, gainLoss: 831.25, gainLossPercent: 22.9 },
    { symbol: "META", name: "Meta Platforms Inc.", quantity: 18, costPerShare: 320.00, currentPrice: 505.75, marketValue: 9103.5, gainLoss: 3343.5, gainLossPercent: 58.1 },
    { symbol: "TSLA", name: "Tesla Inc.", quantity: 12, costPerShare: 220.00, currentPrice: 248.50, marketValue: 2982, gainLoss: 342, gainLossPercent: 13.0 },
    { symbol: "JPM", name: "JPMorgan Chase & Co.", quantity: 40, costPerShare: 155.00, currentPrice: 198.20, marketValue: 7928, gainLoss: 1728, gainLossPercent: 27.9 },
];

type SortKey = "symbol" | "quantity" | "costPerShare" | "currentPrice" | "marketValue" | "gainLoss" | "gainLossPercent" | "allocation";
type SortOrder = "asc" | "desc";

export default function PortfolioPage() {
    const { data: session } = useSession();
    const user = session?.user;
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
    const [hasRealData, setHasRealData] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("marketValue");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    useEffect(() => {
        const loadData = async () => {
            if (!user?.id) return;

            try {
                const response = await fetch("/api/portfolio");
                if (response.ok) {
                    const { portfolio } = await response.json();
                    if (portfolio.holdings.length > 0) {
                        setPortfolioData(portfolio);
                        setHasRealData(true);
                    }
                }
            } catch (error) {
                console.error("Failed to load portfolio data:", error);
            }
        };

        loadData();
    }, [user?.id]);

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

    const formatPercent = (value: number) => {
        return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
    };

    // Get holdings data
    const holdings = hasRealData && portfolioData ? portfolioData.holdings : sampleHoldings;
    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalCost = holdings.reduce((sum, h) => sum + (h.costPerShare * h.quantity), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    // Filter and sort holdings
    const filteredAndSortedHoldings = useMemo(() => {
        let filtered = holdings;

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = holdings.filter(
                (h) =>
                    h.symbol.toLowerCase().includes(query) ||
                    h.name.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        return [...filtered].sort((a, b) => {
            let aVal: number;
            let bVal: number;

            if (sortKey === "symbol") {
                return sortOrder === "asc"
                    ? a.symbol.localeCompare(b.symbol)
                    : b.symbol.localeCompare(a.symbol);
            } else if (sortKey === "allocation") {
                aVal = a.marketValue / totalValue;
                bVal = b.marketValue / totalValue;
            } else {
                aVal = a[sortKey];
                bVal = b[sortKey];
            }

            return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        });
    }, [holdings, searchQuery, sortKey, sortOrder, totalValue]);

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
                    <Link href="/portfolio" className={`${dashStyles.navItem} ${dashStyles.navItemActive}`}>
                        <span className={dashStyles.navIcon}>💼</span>
                        Portfolio
                    </Link>
                    <Link href="/transactions" className={dashStyles.navItem}>
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
                        <h1 className={dashStyles.pageTitle}>Portfolio</h1>
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

                <div className={styles.portfolioPage}>
                    {/* Header */}
                    <div className={styles.portfolioHeader}>
                        <h2 className={styles.portfolioTitle}>
                            {holdings.length} Holdings
                        </h2>
                        <div className={styles.portfolioActions}>
                            <input
                                type="text"
                                placeholder="Search holdings..."
                                className={styles.searchInput}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Value</div>
                            <div className={styles.summaryValue}>{formatCurrency(totalValue)}</div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Cost</div>
                            <div className={styles.summaryValue}>{formatCurrency(totalCost)}</div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Gain/Loss</div>
                            <div className={`${styles.summaryValue} ${totalGainLoss >= 0 ? styles.positive : styles.negative}`}>
                                {formatCurrency(totalGainLoss)}
                            </div>
                            <div className={`${styles.summaryChange} ${totalGainLoss >= 0 ? styles.positive : styles.negative}`}>
                                {formatPercent(totalGainLossPercent)}
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Positions</div>
                            <div className={styles.summaryValue}>{holdings.length}</div>
                        </div>
                    </div>

                    {/* Holdings Table */}
                    <div className={styles.holdingsCard}>
                        {filteredAndSortedHoldings.length > 0 ? (
                            <div className={styles.tableContainer}>
                                <table className={styles.holdingsTable}>
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort("symbol")}>
                                                Symbol <SortIcon column="symbol" />
                                            </th>
                                            <th onClick={() => handleSort("quantity")}>
                                                Shares <SortIcon column="quantity" />
                                            </th>
                                            <th onClick={() => handleSort("costPerShare")}>
                                                Avg Cost <SortIcon column="costPerShare" />
                                            </th>
                                            <th onClick={() => handleSort("currentPrice")}>
                                                Price <SortIcon column="currentPrice" />
                                            </th>
                                            <th onClick={() => handleSort("marketValue")}>
                                                Value <SortIcon column="marketValue" />
                                            </th>
                                            <th onClick={() => handleSort("gainLoss")}>
                                                Gain/Loss <SortIcon column="gainLoss" />
                                            </th>
                                            <th onClick={() => handleSort("gainLossPercent")}>
                                                Return <SortIcon column="gainLossPercent" />
                                            </th>
                                            <th onClick={() => handleSort("allocation")}>
                                                Allocation <SortIcon column="allocation" />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAndSortedHoldings.map((holding) => {
                                            const allocation = (holding.marketValue / totalValue) * 100;
                                            return (
                                                <tr key={holding.symbol}>
                                                    <td>
                                                        <div className={styles.symbolCell}>
                                                            <div className={styles.symbolIcon}>
                                                                {holding.symbol.slice(0, 2)}
                                                            </div>
                                                            <div className={styles.symbolInfo}>
                                                                <span className={styles.symbolName}>{holding.symbol}</span>
                                                                <span className={styles.symbolDescription}>{holding.name}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={styles.numericCell}>{holding.quantity.toFixed(2)}</td>
                                                    <td className={styles.numericCell}>{formatCurrency(holding.costPerShare)}</td>
                                                    <td className={styles.numericCell}>{formatCurrency(holding.currentPrice)}</td>
                                                    <td className={styles.numericCell}>{formatCurrency(holding.marketValue)}</td>
                                                    <td className={`${styles.numericCell} ${holding.gainLoss >= 0 ? styles.positive : styles.negative}`}>
                                                        {formatCurrency(holding.gainLoss)}
                                                    </td>
                                                    <td className={`${styles.numericCell} ${holding.gainLossPercent >= 0 ? styles.positive : styles.negative}`}>
                                                        {formatPercent(holding.gainLossPercent)}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                            <div className={styles.allocationBar}>
                                                                <div
                                                                    className={styles.allocationFill}
                                                                    style={{ width: `${Math.min(allocation, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className={styles.numericCell} style={{ width: '45px' }}>
                                                                {allocation.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>🔍</div>
                                <h3 className={styles.emptyTitle}>No holdings found</h3>
                                <p className={styles.emptyText}>
                                    {searchQuery
                                        ? `No holdings match "${searchQuery}"`
                                        : "Upload your Schwab portfolio to see your holdings here."}
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

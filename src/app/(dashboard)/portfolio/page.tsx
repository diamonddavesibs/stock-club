"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import dashStyles from "../dashboard.module.css";
import styles from "./portfolio.module.css";
import { dfdiiHoldingsAsPortfolio, staticHoldings as dfdiiStaticHoldings } from "@/lib/dfdii-data";
import { Holding } from "@/lib/types";

interface LivePrice {
    currentPrice: number;
    change: number;
    changePercent: number;
    previousClose: number;
}

type SortKey = "symbol" | "quantity" | "costPerShare" | "currentPrice" | "marketValue" | "gainLoss" | "gainLossPercent" | "allocation";
type SortOrder = "asc" | "desc";

export default function PortfolioPage() {
    const { data: session } = useSession();
    const user = session?.user;
    const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});
    const [pricesLoading, setPricesLoading] = useState(false);
    const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("marketValue");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchLivePrices = async () => {
            setPricesLoading(true);
            try {
                const symbols = dfdiiHoldingsAsPortfolio.map(h => h.symbol);
                const response = await fetch("/api/stock-prices", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ symbols }),
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.quotes) {
                        const prices: Record<string, LivePrice> = {};
                        Object.entries(data.quotes).forEach(([symbol, quote]: [string, any]) => {
                            prices[symbol] = {
                                currentPrice: quote.currentPrice,
                                change: quote.change,
                                changePercent: quote.changePercent,
                                previousClose: quote.previousClose,
                            };
                        });
                        setLivePrices(prices);
                        setLastPriceUpdate(new Date());
                    }
                }
            } catch (error) {
                console.error("Failed to fetch live prices:", error);
            } finally {
                setPricesLoading(false);
            }
        };

        fetchLivePrices();
        const interval = setInterval(fetchLivePrices, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
    };

    const formatPercent = (value: number) => {
        return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
    };

    const holdings: Holding[] = useMemo(() => {
        if (Object.keys(livePrices).length === 0) return dfdiiHoldingsAsPortfolio;

        return dfdiiHoldingsAsPortfolio.map(holding => {
            const livePrice = livePrices[holding.symbol];
            if (!livePrice) return holding;

            const newMarketValue = holding.quantity * livePrice.currentPrice;
            const totalCost = holding.quantity * holding.costPerShare;
            const newGainLoss = newMarketValue - totalCost;
            const newGainLossPercent = totalCost > 0 ? (newGainLoss / totalCost) * 100 : 0;

            return {
                ...holding,
                currentPrice: livePrice.currentPrice,
                marketValue: newMarketValue,
                gainLoss: newGainLoss,
                gainLossPercent: newGainLossPercent,
            };
        });
    }, [livePrices]);

    const totalValue = useMemo(() => holdings.reduce((sum, h) => sum + h.marketValue, 0), [holdings]);
    const totalCost = useMemo(() => holdings.reduce((sum, h) => sum + (h.costPerShare * h.quantity), 0), [holdings]);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    const totalDividends = dfdiiStaticHoldings.reduce((sum, h) => sum + h.dividends, 0);
    const totalReturn = totalGainLoss + totalDividends;
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    const filteredAndSortedHoldings = useMemo(() => {
        let filtered = holdings;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = holdings.filter(h =>
                h.symbol.toLowerCase().includes(query) ||
                h.name.toLowerCase().includes(query)
            );
        }

        return [...filtered].sort((a, b) => {
            if (sortKey === "symbol") {
                return sortOrder === "asc"
                    ? a.symbol.localeCompare(b.symbol)
                    : b.symbol.localeCompare(a.symbol);
            }
            const aVal = sortKey === "allocation" ? a.marketValue / totalValue : a[sortKey];
            const bVal = sortKey === "allocation" ? b.marketValue / totalValue : b[sortKey];
            return sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
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
            <div
                className={`${dashStyles.sidebarOverlay} ${sidebarOpen ? dashStyles.sidebarOverlayVisible : ""}`}
                onClick={() => setSidebarOpen(false)}
            />

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
                    <Link href="/dfdii-holdings" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>📈</span>
                        DFDII Holdings
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

            <main className={dashStyles.mainContent}>
                <header className={dashStyles.header}>
                    <div className={dashStyles.headerContent}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                            <button className={dashStyles.menuButton} onClick={() => setSidebarOpen(true)}>☰</button>
                            <h1 className={dashStyles.pageTitle}>Portfolio</h1>
                        </div>
                        <div className={dashStyles.headerActions}>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                {pricesLoading
                                    ? "Updating prices..."
                                    : lastPriceUpdate
                                        ? `Updated ${lastPriceUpdate.toLocaleTimeString()}`
                                        : "Loading prices..."}
                            </span>
                        </div>
                    </div>
                </header>

                <div className={styles.portfolioPage}>
                    <div className={styles.portfolioHeader}>
                        <h2 className={styles.portfolioTitle}>{holdings.length} Holdings</h2>
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

                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Market Value</div>
                            <div className={styles.summaryValue}>{formatCurrency(totalValue)}</div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Cost Basis</div>
                            <div className={styles.summaryValue}>{formatCurrency(totalCost)}</div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Price Gain/Loss</div>
                            <div className={`${styles.summaryValue} ${totalGainLoss >= 0 ? styles.positive : styles.negative}`}>
                                {formatCurrency(totalGainLoss)}
                            </div>
                            <div className={`${styles.summaryChange} ${totalGainLoss >= 0 ? styles.positive : styles.negative}`}>
                                {formatPercent(totalGainLossPercent)}
                            </div>
                        </div>
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryLabel}>Total Return (incl. dividends)</div>
                            <div className={`${styles.summaryValue} ${totalReturn >= 0 ? styles.positive : styles.negative}`}>
                                {formatCurrency(totalReturn)}
                            </div>
                            <div className={`${styles.summaryChange} ${totalReturn >= 0 ? styles.positive : styles.negative}`}>
                                {formatPercent(totalReturnPercent)}
                            </div>
                        </div>
                    </div>

                    <div className={styles.holdingsCard}>
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
                                        const allocation = totalValue > 0 ? (holding.marketValue / totalValue) * 100 : 0;
                                        return (
                                            <tr key={holding.symbol}>
                                                <td>
                                                    <Link href={`/stock/${holding.symbol}`} style={{ textDecoration: 'none' }}>
                                                        <div className={styles.symbolCell}>
                                                            <div className={styles.symbolIcon}>
                                                                {holding.symbol.slice(0, 2)}
                                                            </div>
                                                            <div className={styles.symbolInfo}>
                                                                <span className={styles.symbolName} style={{ color: 'var(--color-accent-primary)' }}>{holding.symbol}</span>
                                                                <span className={styles.symbolDescription}>{holding.name}</span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className={styles.numericCell}>{holding.quantity.toLocaleString()}</td>
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
                        {filteredAndSortedHoldings.length === 0 && searchQuery && (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>🔍</div>
                                <h3 className={styles.emptyTitle}>No holdings found</h3>
                                <p className={styles.emptyText}>No holdings match &quot;{searchQuery}&quot;</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

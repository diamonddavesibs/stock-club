"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import dashStyles from "../dashboard.module.css";
import styles from "./dfdii-holdings.module.css";
import { DFDIIHolding, staticHoldings } from "@/lib/dfdii-data";

interface LivePrice {
    currentPrice: number;
    change: number;
    changePercent: number;
}


type SortKey = "symbol" | "qty" | "price" | "date" | "lastPrice" | "costBasis" | "marketValue" | "gainDollar" | "gainPercent" | "dividends" | "return" | "returnPercent" | "returnPerMonth";
type SortOrder = "asc" | "desc";

export default function DFDIIHoldingsPage() {
    const { data: session } = useSession();
    const user = session?.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [holdings, setHoldings] = useState<DFDIIHolding[]>(staticHoldings);
    const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});
    const [pricesLoading, setPricesLoading] = useState(false);
    const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("symbol");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

    const getInitials = (name: string) => {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    // Fetch live prices
    useEffect(() => {
        const fetchLivePrices = async () => {
            setPricesLoading(true);
            try {
                const symbols = staticHoldings.map(h => h.symbol);
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
        // Refresh every 5 minutes
        const interval = setInterval(fetchLivePrices, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Calculate live values when prices update
    useEffect(() => {
        const updatedHoldings = staticHoldings.map(holding => {
            const livePrice = livePrices[holding.symbol];
            if (livePrice) {
                const lastPrice = livePrice.currentPrice;
                const marketValue = holding.qty * lastPrice;
                const gainDollar = marketValue - holding.costBasis;
                const gainPercent = (gainDollar / holding.costBasis) * 100;
                const returnValue = gainDollar + holding.dividends;
                const returnPercent = (returnValue / holding.costBasis) * 100;
                const returnPerMonth = holding.monthsHeld > 0 ? returnPercent / holding.monthsHeld : 0;

                return {
                    ...holding,
                    lastPrice,
                    marketValue,
                    gainDollar,
                    gainPercent,
                    return: returnValue,
                    returnPercent,
                    returnPerMonth,
                };
            }
            return holding;
        });
        setHoldings(updatedHoldings);
    }, [livePrices]);

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined) return "—";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    const formatPercent = (value: number | undefined) => {
        if (value === undefined) return "—";
        return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("en-US").format(value);
    };

    // Calculate totals
    const totals = useMemo(() => {
        const totalCostBasis = holdings.reduce((sum, h) => sum + h.costBasis, 0);
        const totalMarketValue = holdings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
        const totalGainDollar = holdings.reduce((sum, h) => sum + (h.gainDollar || 0), 0);
        const totalGainPercent = totalCostBasis > 0 ? (totalGainDollar / totalCostBasis) * 100 : 0;
        const totalDividends = holdings.reduce((sum, h) => sum + h.dividends, 0);
        const totalReturn = holdings.reduce((sum, h) => sum + (h.return || 0), 0);
        const totalReturnPercent = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;

        return {
            costBasis: totalCostBasis,
            marketValue: totalMarketValue,
            gainDollar: totalGainDollar,
            gainPercent: totalGainPercent,
            dividends: totalDividends,
            return: totalReturn,
            returnPercent: totalReturnPercent,
        };
    }, [holdings]);

    // Filter and sort holdings
    const filteredAndSortedHoldings = useMemo(() => {
        let filtered = holdings;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = holdings.filter(h => h.symbol.toLowerCase().includes(query));
        }

        return [...filtered].sort((a, b) => {
            let aVal: any;
            let bVal: any;

            if (sortKey === "symbol" || sortKey === "date") {
                aVal = a[sortKey];
                bVal = b[sortKey];
                if (typeof aVal === "string" && typeof bVal === "string") {
                    return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
            }

            aVal = a[sortKey] ?? 0;
            bVal = b[sortKey] ?? 0;
            return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        });
    }, [holdings, searchQuery, sortKey, sortOrder]);

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
                    <Link href="/dfdii-holdings" className={`${dashStyles.navItem} ${dashStyles.navItemActive}`}>
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
                            <h1 className={dashStyles.pageTitle}>Dining for Dollars II Stock Holdings</h1>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                Live pricing from Finnhub API
                                {lastPriceUpdate && (
                                    <> • Last updated: {lastPriceUpdate.toLocaleTimeString()}</>
                                )}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Summary Cards */}
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>Total Cost Basis</div>
                        <div className={styles.summaryValue}>{formatCurrency(totals.costBasis)}</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>Market Value</div>
                        <div className={styles.summaryValue}>{formatCurrency(totals.marketValue)}</div>
                        <div className={`${styles.summaryChange} ${totals.gainDollar >= 0 ? styles.positive : styles.negative}`}>
                            {formatCurrency(totals.gainDollar)} ({formatPercent(totals.gainPercent)})
                        </div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>Total Dividends</div>
                        <div className={styles.summaryValue}>{formatCurrency(totals.dividends)}</div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>Total Return</div>
                        <div className={styles.summaryValue}>{formatCurrency(totals.return)}</div>
                        <div className={`${styles.summaryChange} ${totals.return >= 0 ? styles.positive : styles.negative}`}>
                            {formatPercent(totals.returnPercent)}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    <input
                        type="text"
                        placeholder="Search by symbol..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        {pricesLoading ? "Updating prices..." : `${filteredAndSortedHoldings.length} holdings`}
                    </div>
                </div>

                {/* Holdings Table */}
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort("symbol")}>
                                    Symbol <SortIcon column="symbol" />
                                </th>
                                <th onClick={() => handleSort("qty")} style={{ textAlign: 'right' }}>
                                    Qty <SortIcon column="qty" />
                                </th>
                                <th onClick={() => handleSort("price")} style={{ textAlign: 'right' }}>
                                    Price <SortIcon column="price" />
                                </th>
                                <th onClick={() => handleSort("date")}>
                                    Date <SortIcon column="date" />
                                </th>
                                <th onClick={() => handleSort("lastPrice")} style={{ textAlign: 'right' }}>
                                    Last <SortIcon column="lastPrice" />
                                </th>
                                <th onClick={() => handleSort("costBasis")} style={{ textAlign: 'right' }}>
                                    Cost Basis <SortIcon column="costBasis" />
                                </th>
                                <th onClick={() => handleSort("marketValue")} style={{ textAlign: 'right' }}>
                                    Mkt Val <SortIcon column="marketValue" />
                                </th>
                                <th onClick={() => handleSort("gainDollar")} style={{ textAlign: 'right' }}>
                                    Gain ($) <SortIcon column="gainDollar" />
                                </th>
                                <th onClick={() => handleSort("gainPercent")} style={{ textAlign: 'right' }}>
                                    Gain (%) <SortIcon column="gainPercent" />
                                </th>
                                <th onClick={() => handleSort("dividends")} style={{ textAlign: 'right' }}>
                                    Dividends <SortIcon column="dividends" />
                                </th>
                                <th onClick={() => handleSort("return")} style={{ textAlign: 'right' }}>
                                    Return <SortIcon column="return" />
                                </th>
                                <th onClick={() => handleSort("returnPercent")} style={{ textAlign: 'right' }}>
                                    Return% <SortIcon column="returnPercent" />
                                </th>
                                <th style={{ textAlign: 'right' }}>M's</th>
                                <th onClick={() => handleSort("returnPerMonth")} style={{ textAlign: 'right' }}>
                                    Ret%/M <SortIcon column="returnPerMonth" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedHoldings.map((holding) => (
                                <tr key={holding.symbol}>
                                    <td>
                                        <Link href={`/stock/${holding.symbol}`} className={styles.symbolLink}>
                                            {holding.symbol}
                                        </Link>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>{formatNumber(holding.qty)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(holding.price)}</td>
                                    <td>{holding.date}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        {holding.lastPrice ? (
                                            <span className={styles.livePrice}>
                                                {formatCurrency(holding.lastPrice)}
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(holding.costBasis)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(holding.marketValue)}</td>
                                    <td style={{ textAlign: 'right' }} className={holding.gainDollar && holding.gainDollar >= 0 ? styles.positive : styles.negative}>
                                        {formatCurrency(holding.gainDollar)}
                                    </td>
                                    <td style={{ textAlign: 'right' }} className={holding.gainPercent && holding.gainPercent >= 0 ? styles.positive : styles.negative}>
                                        {formatPercent(holding.gainPercent)}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(holding.dividends)}</td>
                                    <td style={{ textAlign: 'right' }} className={holding.return && holding.return >= 0 ? styles.positive : styles.negative}>
                                        {formatCurrency(holding.return)}
                                    </td>
                                    <td style={{ textAlign: 'right' }} className={holding.returnPercent && holding.returnPercent >= 0 ? styles.positive : styles.negative}>
                                        {formatPercent(holding.returnPercent)}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>{holding.monthsHeld}</td>
                                    <td style={{ textAlign: 'right' }} className={holding.returnPerMonth && holding.returnPerMonth >= 0 ? styles.positive : styles.negative}>
                                        {formatPercent(holding.returnPerMonth)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className={styles.totalRow}>
                                <td colSpan={5}><strong>TOTALS</strong></td>
                                <td style={{ textAlign: 'right' }}><strong>{formatCurrency(totals.costBasis)}</strong></td>
                                <td style={{ textAlign: 'right' }}><strong>{formatCurrency(totals.marketValue)}</strong></td>
                                <td style={{ textAlign: 'right' }} className={totals.gainDollar >= 0 ? styles.positive : styles.negative}>
                                    <strong>{formatCurrency(totals.gainDollar)}</strong>
                                </td>
                                <td style={{ textAlign: 'right' }} className={totals.gainPercent >= 0 ? styles.positive : styles.negative}>
                                    <strong>{formatPercent(totals.gainPercent)}</strong>
                                </td>
                                <td style={{ textAlign: 'right' }}><strong>{formatCurrency(totals.dividends)}</strong></td>
                                <td style={{ textAlign: 'right' }} className={totals.return >= 0 ? styles.positive : styles.negative}>
                                    <strong>{formatCurrency(totals.return)}</strong>
                                </td>
                                <td style={{ textAlign: 'right' }} className={totals.returnPercent >= 0 ? styles.positive : styles.negative}>
                                    <strong>{formatPercent(totals.returnPercent)}</strong>
                                </td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Info Note */}
                <div className={styles.infoNote}>
                    <strong>Note:</strong> Static data (Qty, Price, Date, Cost Basis, Dividends, Months Held) is from the original PDF as of 6/16/2026.
                    Live pricing updates Market Value, Gain, and Return calculations automatically via Finnhub API.
                </div>
            </main> 
        </div>
    );
}
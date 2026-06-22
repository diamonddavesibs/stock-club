"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import dashStyles from "../dashboard.module.css";
import styles from "./dfdii-holdings.module.css";

interface DFDIIHolding {
    symbol: string;
    qty: number;
    price: number;
    date: string;
    costBasis: number;
    dividends: number;
    yieldPercent: number;
    divYTD: number;
    monthsHeld: number;
    // Live data fields
    lastPrice?: number;
    marketValue?: number;
    dayChange?: number;
    dayChangePercent?: number;
    gainDollar?: number;
    gainPercent?: number;
    return?: number;
    returnPercent?: number;
    returnPerMonth?: number;
}

interface LivePrice {
    currentPrice: number;
    change: number;
    changePercent: number;
}

// Static data from the PDF (as of 6/16/2026)
const staticHoldings: DFDIIHolding[] = [
    { symbol: "GGN", qty: 6400, price: 3.18, date: "2/17/2021", costBasis: 20382.08, dividends: 10654.00, yieldPercent: 0, divYTD: 0, monthsHeld: 64 },
    { symbol: "AMZN", qty: 175, price: 141.93, date: "9/21/2022", costBasis: 24838.10, dividends: 0.00, yieldPercent: 0, divYTD: 0, monthsHeld: 45 },
    { symbol: "GNRC", qty: 100, price: 113.47, date: "4/16/2025", costBasis: 11347.00, dividends: 0.00, yieldPercent: 0, divYTD: 0, monthsHeld: 14 },
    { symbol: "GNT", qty: 2000, price: 4.13, date: "3/16/2022", costBasis: 8250.40, dividends: 3980.00, yieldPercent: 0, divYTD: 0, monthsHeld: 51 },
    { symbol: "KO", qty: 300, price: 53.56, date: "2/17/2021", costBasis: 16069.47, dividends: 3743.00, yieldPercent: 0, divYTD: 0, monthsHeld: 64 },
    { symbol: "ET", qty: 1000, price: 12.64, date: "8/16/2023", costBasis: 12639.00, dividends: 3575.00, yieldPercent: 0, divYTD: 0, monthsHeld: 34 },
    { symbol: "EPD", qty: 400, price: 23.46, date: "3/17/2021", costBasis: 9384.00, dividends: 4332.00, yieldPercent: 0, divYTD: 0, monthsHeld: 63 },
    { symbol: "DNP", qty: 1000, price: 9.62, date: "5/19/2021", costBasis: 9616.80, dividends: 4570.00, yieldPercent: 0, divYTD: 0, monthsHeld: 61 },
    { symbol: "CVX", qty: 100, price: 136.64, date: "4/16/2025", costBasis: 13664.00, dividends: 869.00, yieldPercent: 0, divYTD: 0, monthsHeld: 14 },
    { symbol: "NVDA", qty: 75, price: 140.20, date: "10/1/2024", costBasis: 10515.00, dividends: 3.75, yieldPercent: 0, divYTD: 0, monthsHeld: 8 },
    { symbol: "CLM", qty: 2551, price: 6.96, date: "9/22/2021", costBasis: 17750.47, dividends: 3047.31, yieldPercent: 0, divYTD: 0, monthsHeld: 57 },
    { symbol: "GUT", qty: 1000, price: 5.30, date: "3/17/2021", costBasis: 5303.10, dividends: 3150.00, yieldPercent: 0, divYTD: 0, monthsHeld: 63 },
    { symbol: "WMT", qty: 100, price: 89.78, date: "3/19/2025", costBasis: 8978.00, dividends: 145.75, yieldPercent: 0, divYTD: 0, monthsHeld: 15 },
    { symbol: "SYK", qty: 50, price: 266.86, date: "8/18/2021", costBasis: 13342.85, dividends: 738.50, yieldPercent: 0, divYTD: 0, monthsHeld: 58 },
    { symbol: "BMY", qty: 200, price: 50.02, date: "2/21/2024", costBasis: 10003.98, dividends: 1352.00, yieldPercent: 0, divYTD: 0, monthsHeld: 28 },
    { symbol: "PHK", qty: 2500, price: 5.54, date: "2/17/2021", costBasis: 13841.50, dividends: 4882.00, yieldPercent: 0, divYTD: 0, monthsHeld: 64 },
    { symbol: "AAPL", qty: 60, price: 259.27, date: "10/22/2025", costBasis: 15556.20, dividends: 37.00, yieldPercent: 0, divYTD: 0, monthsHeld: 8 },
    { symbol: "CRF", qty: 2070, price: 7.88, date: "11/17/2021", costBasis: 16299.27, dividends: 3677.08, yieldPercent: 0, divYTD: 0, monthsHeld: 55 },
    { symbol: "BKR", qty: 100, price: 53.50, date: "1/21/2026", costBasis: 5350.00, dividends: 46.00, yieldPercent: 0, divYTD: 0, monthsHeld: 5 },
    { symbol: "AUR", qty: 750, price: 5.70, date: "8/20/2025", costBasis: 4275.00, dividends: 0.00, yieldPercent: 0, divYTD: 0, monthsHeld: 10 },
    { symbol: "ORCL", qty: 100, price: 185.75, date: "11/19/2025", costBasis: 18575.00, dividends: 25.00, yieldPercent: 0, divYTD: 0, monthsHeld: 7 },
    { symbol: "HD", qty: 50, price: 339.58, date: "11/19/2025", costBasis: 16978.93, dividends: 232.25, yieldPercent: 0, divYTD: 0, monthsHeld: 7 },
    { symbol: "APLD", qty: 100, price: 45.24, date: "5/27/2026", costBasis: 4524.00, dividends: 0.00, yieldPercent: 0, divYTD: 0, monthsHeld: 1 },
    { symbol: "LGN", qty: 100, price: 88.87, date: "5/27/2026", costBasis: 8887.00, dividends: 0.00, yieldPercent: 0, divYTD: 0, monthsHeld: 1 },
    { symbol: "IBM", qty: 30, price: 290.00, date: "11/19/2025", costBasis: 8700.00, dividends: 101.10, yieldPercent: 0, divYTD: 0, monthsHeld: 7 },
    { symbol: "LEN", qty: 100, price: 105.63, date: "4/16/2025", costBasis: 10563.00, dividends: 250.00, yieldPercent: 0, divYTD: 0, monthsHeld: 14 },
    { symbol: "PLTR", qty: 50, price: 167.65, date: "11/19/2025", costBasis: 8382.50, dividends: 0.00, yieldPercent: 0, divYTD: 0, monthsHeld: 7 },
    { symbol: "RKT", qty: 250, price: 21.10, date: "9/17/2025", costBasis: 5273.75, dividends: 0.00, yieldPercent: 0, divYTD: 0, monthsHeld: 9 },
    { symbol: "HUMA", qty: 2000, price: 2.43, date: "5/21/2025", costBasis: 4856.40, dividends: 0.00, yieldPercent: 0, divYTD: 0, monthsHeld: 13 },
    { symbol: "BSX", qty: 150, price: 70.43, date: "3/19/2026", costBasis: 10564.50, dividends: 0.00, yieldPercent: 0, divYTD: 0, monthsHeld: 3 },
];

type SortKey = "symbol" | "qty" | "price" | "date" | "lastPrice" | "costBasis" | "marketValue" | "dayChange" | "dayChangePercent" | "gainDollar" | "gainPercent" | "dividends" | "return" | "returnPercent" | "returnPerMonth";
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
    const [showDayChangePercent, setShowDayChangePercent] = useState(false);

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
                const dayChange = holding.qty * livePrice.change;
                const dayChangePercent = livePrice.changePercent;
                const gainDollar = marketValue - holding.costBasis;
                const gainPercent = (gainDollar / holding.costBasis) * 100;
                const returnValue = gainDollar + holding.dividends;
                const returnPercent = (returnValue / holding.costBasis) * 100;
                const returnPerMonth = holding.monthsHeld > 0 ? returnPercent / holding.monthsHeld : 0;

                return {
                    ...holding,
                    lastPrice,
                    marketValue,
                    dayChange,
                    dayChangePercent,
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
        const totalDayChange = holdings.reduce((sum, h) => sum + (h.dayChange || 0), 0);
        const totalDayChangePercent = totalMarketValue > 0 ? (totalDayChange / (totalMarketValue - totalDayChange)) * 100 : 0;
        const totalGainDollar = holdings.reduce((sum, h) => sum + (h.gainDollar || 0), 0);
        const totalGainPercent = totalCostBasis > 0 ? (totalGainDollar / totalCostBasis) * 100 : 0;
        const totalDividends = holdings.reduce((sum, h) => sum + h.dividends, 0);
        const totalReturn = holdings.reduce((sum, h) => sum + (h.return || 0), 0);
        const totalReturnPercent = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;

        return {
            costBasis: totalCostBasis,
            marketValue: totalMarketValue,
            dayChange: totalDayChange,
            dayChangePercent: totalDayChangePercent,
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
                        <div className={styles.summaryLabel}>Today's Change</div>
                        <div className={`${styles.summaryValue} ${totals.dayChange >= 0 ? styles.positive : styles.negative}`}>
                            {formatCurrency(totals.dayChange)}
                        </div>
                        <div className={`${styles.summaryChange} ${totals.dayChange >= 0 ? styles.positive : styles.negative}`}>
                            {formatPercent(totals.dayChangePercent)}
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
                                <th
                                    onClick={() => {
                                        setShowDayChangePercent(!showDayChangePercent);
                                        handleSort(showDayChangePercent ? "dayChange" : "dayChangePercent");
                                    }}
                                    style={{ textAlign: 'right', cursor: 'pointer' }}
                                    className={styles.toggleHeader}
                                    title="Click to toggle between $ and %"
                                >
                                    Day {showDayChangePercent ? "%" : "$"} <SortIcon column={showDayChangePercent ? "dayChangePercent" : "dayChange"} />
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
                                    <td style={{ textAlign: 'right' }} className={holding.dayChange && holding.dayChange >= 0 ? styles.positive : styles.negative}>
                                        {showDayChangePercent ? formatPercent(holding.dayChangePercent) : formatCurrency(holding.dayChange)}
                                    </td>
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
                                <td colSpan={6}><strong>TOTALS</strong></td>
                                <td style={{ textAlign: 'right' }}><strong>{formatCurrency(totals.marketValue)}</strong></td>
                                <td style={{ textAlign: 'right' }} className={totals.dayChange >= 0 ? styles.positive : styles.negative}>
                                    <strong>{showDayChangePercent ? formatPercent(totals.dayChangePercent) : formatCurrency(totals.dayChange)}</strong>
                                </td>
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
                    Live pricing updates Market Value, Day Change, Gain, and Return calculations automatically via Finnhub API.
                    <strong> Click "Day $ / %" column header to toggle between dollar and percentage view.</strong>
                </div>
            </main>
        </div>
    );
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
}
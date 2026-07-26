"use client";
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import styles from "../dashboard.module.css";
import dfdiiStyles from "../dfdii-holdings/dfdii-holdings.module.css";
import { PortfolioData } from "@/lib/types";
import PortfolioPerformanceChart from "@/components/charts/PortfolioPerformanceChart";
import PortfolioAllocationChart from "@/components/charts/PortfolioAllocationChart";
import StockTicker from "@/components/StockTicker";
import StockSearch from "@/components/StockSearch";
import { dfdiiHoldingsAsPortfolio, staticHoldings as dfdiiStaticHoldings } from "@/lib/dfdii-data";

// Type for live stock prices
interface LivePrice {
    currentPrice: number;
    change: number;
    changePercent: number;
    previousClose: number;
}

interface StockQuote {
    currentPrice: number;
    change: number;
    changePercent: number;
    previousClose: number;
}

interface DashboardHoldingRow {
    symbol: string;
    qty: number;
    price: number;
    date: string;
    costBasis: number;
    dividends: number;
    monthsHeld: number;
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

type HoldingsSortKey = "symbol" | "qty" | "price" | "date" | "lastPrice" | "costBasis" | "marketValue" | "dayChange" | "dayChangePercent" | "gainDollar" | "gainPercent" | "dividends" | "return" | "returnPercent" | "returnPerMonth";
type SortOrder = "asc" | "desc";

export default function DashboardPage() {
    const { data: session } = useSession();
    const user = session?.user;
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasRealData, setHasRealData] = useState(false);
    const [livePrices, setLivePrices] = useState<Record<string, LivePrice>>({});
    const [pricesLoading, setPricesLoading] = useState(false);
    const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [now, setNow] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState("");
    const [sortKey, setSortKey] = useState<HoldingsSortKey>("symbol");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [showDayChangePercent, setShowDayChangePercent] = useState(false);

    useEffect(() => {
        // Load portfolio data from API
        const loadData = async () => {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

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
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user?.id]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch live prices when holdings are available
    useEffect(() => {
        const fetchLivePrices = async () => {
            const holdingsToPrice = dfdiiHoldingsAsPortfolio;

            if (holdingsToPrice.length === 0) return;

            setPricesLoading(true);
            try {
                const symbols = holdingsToPrice.map(h => h.symbol);
                const response = await fetch("/api/stock-prices", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ symbols }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.quotes) {
                        const prices: Record<string, LivePrice> = {};
                        Object.entries(data.quotes as Record<string, StockQuote>).forEach(([symbol, quote]) => {
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

        // Fetch immediately and then every 5 minutes
        fetchLivePrices();
        const interval = setInterval(fetchLivePrices, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [hasRealData, portfolioData]);

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatCurrencyDetailed = (value: number | undefined) => {
        if (value === undefined) return "—";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    const formatPercent = (value: number) => {
        return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
    };

    const formatPercentDetailed = (value: number | undefined) => {
        if (value === undefined) return "—";
        return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("en-US").format(value);
    };

    // Always use DFDII holdings as the base
    const baseHoldings = dfdiiHoldingsAsPortfolio;

    // Update holdings with live prices
    const holdings = useMemo(() => {
        if (Object.keys(livePrices).length === 0) {
            return baseHoldings;
        }

        return baseHoldings.map(holding => {
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
    }, [baseHoldings, livePrices]);

    // Calculate today's change from live prices
    const todaysChange = useMemo(() => {
        if (Object.keys(livePrices).length === 0) {
            return { value: 0, percent: 0 };
        }

        let totalChange = 0;
        let totalPreviousValue = 0;

        baseHoldings.forEach(holding => {
            const livePrice = livePrices[holding.symbol];
            if (livePrice) {
                totalChange += holding.quantity * livePrice.change;
                totalPreviousValue += holding.quantity * livePrice.previousClose;
            }
        });

        const percent = totalPreviousValue > 0 ? (totalChange / totalPreviousValue) * 100 : 0;
        return { value: totalChange, percent };
    }, [baseHoldings, livePrices]);

    // Calculate total portfolio value with live prices
    const totalPortfolioValue = useMemo(() => {
        return holdings.reduce((sum, h) => sum + h.marketValue, 0);
    }, [holdings]);

    const totalGainLoss = useMemo(() => {
        const totalCost = holdings.reduce((sum, h) => sum + (h.costPerShare * h.quantity), 0);
        return totalPortfolioValue - totalCost;
    }, [holdings, totalPortfolioValue]);

    const totalGainLossPercent = useMemo(() => {
        const totalCost = holdings.reduce((sum, h) => sum + (h.costPerShare * h.quantity), 0);
        return totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
    }, [holdings, totalGainLoss]);

    const hasLivePrices = Object.keys(livePrices).length > 0;

    const dashboardHoldings = useMemo<DashboardHoldingRow[]>(() => {
        return dfdiiStaticHoldings.map((holding) => {
            const livePrice = livePrices[holding.symbol];
            const lastPrice = livePrice?.currentPrice ?? holding.price;
            const marketValue = holding.qty * lastPrice;
            const dayChange = livePrice ? holding.qty * livePrice.change : undefined;
            const dayChangePercent = livePrice?.changePercent;
            const gainDollar = marketValue - holding.costBasis;
            const gainPercent = holding.costBasis > 0 ? (gainDollar / holding.costBasis) * 100 : 0;
            const returnValue = gainDollar + holding.dividends;
            const returnPercent = holding.costBasis > 0 ? (returnValue / holding.costBasis) * 100 : 0;
            const returnPerMonth = holding.monthsHeld > 0 ? returnPercent / holding.monthsHeld : 0;

            return {
                symbol: holding.symbol,
                qty: holding.qty,
                price: holding.price,
                date: holding.date,
                costBasis: holding.costBasis,
                dividends: holding.dividends,
                monthsHeld: holding.monthsHeld,
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
        });
    }, [livePrices]);

    const holdingsTotals = useMemo(() => {
        const totalCostBasis = dashboardHoldings.reduce((sum, h) => sum + h.costBasis, 0);
        const totalMarketValue = dashboardHoldings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
        const totalDayChange = dashboardHoldings.reduce((sum, h) => sum + (h.dayChange || 0), 0);
        const totalDayChangePercent = totalMarketValue > 0 ? (totalDayChange / (totalMarketValue - totalDayChange)) * 100 : 0;
        const totalGainDollar = dashboardHoldings.reduce((sum, h) => sum + (h.gainDollar || 0), 0);
        const totalGainPercent = totalCostBasis > 0 ? (totalGainDollar / totalCostBasis) * 100 : 0;
        const totalDividends = dashboardHoldings.reduce((sum, h) => sum + h.dividends, 0);
        const totalReturn = dashboardHoldings.reduce((sum, h) => sum + (h.return || 0), 0);
        const totalReturnPercent = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;

        return {
            marketValue: totalMarketValue,
            dayChange: totalDayChange,
            dayChangePercent: totalDayChangePercent,
            gainDollar: totalGainDollar,
            gainPercent: totalGainPercent,
            dividends: totalDividends,
            return: totalReturn,
            returnPercent: totalReturnPercent,
        };
    }, [dashboardHoldings]);

    const filteredAndSortedHoldings = useMemo(() => {
        let filtered = dashboardHoldings;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = dashboardHoldings.filter((h) => h.symbol.toLowerCase().includes(query));
        }

        return [...filtered].sort((a, b) => {
            let aVal: string | number;
            let bVal: string | number;

            if (sortKey === "symbol" || sortKey === "date") {
                aVal = a[sortKey];
                bVal = b[sortKey];
                if (typeof aVal === "string" && typeof bVal === "string") {
                    return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
            }

            aVal = a[sortKey] ?? 0;
            bVal = b[sortKey] ?? 0;

            return sortOrder === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
        });
    }, [dashboardHoldings, searchQuery, sortKey, sortOrder]);

    const handleSort = (key: HoldingsSortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("desc");
        }
    };

    const renderSortIndicator = (column: HoldingsSortKey) => {
        const isActive = sortKey === column;
        return (
            <span className={`${dfdiiStyles.sortIndicator} ${isActive ? dfdiiStyles.sortActive : ""}`}>
                {isActive ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
            </span>
        );
    };

    const totalDividends = dfdiiStaticHoldings.reduce((sum, h) => sum + h.dividends, 0);

    const totalReturn = totalGainLoss + totalDividends;
    const totalCostForReturn = holdings.reduce((sum, h) => sum + (h.costPerShare * h.quantity), 0);
    const totalReturnPercent = totalCostForReturn > 0 ? (totalReturn / totalCostForReturn) * 100 : 0;

    const stats = [
        { label: "Portfolio Value", value: formatCurrency(totalPortfolioValue), change: formatPercent(totalGainLossPercent), positive: totalGainLossPercent >= 0, icon: "💰" },
        { label: "Today's Change", value: hasLivePrices ? formatCurrency(todaysChange.value) : "--", change: hasLivePrices ? formatPercent(todaysChange.percent) : (pricesLoading ? "Loading..." : "--"), positive: todaysChange.value >= 0, icon: "📈" },
        { label: "Total Return", value: formatCurrency(totalReturn), change: formatPercent(totalReturnPercent), positive: totalReturn >= 0, icon: "🎯" },
        { label: "Dividends Received", value: formatCurrency(totalDividends), change: `${holdings.length} holdings`, positive: true, icon: "💵" },
    ];

    // Generate performance chart data
    const performanceData = useMemo(() => {
        const data = [];
        const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
        const totalCost = holdings.reduce((sum, h) => sum + (h.costPerShare * h.quantity), 0);
        const daysToShow = 30;

        for (let i = daysToShow; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            // Simulate historical performance with some variation
            const progress = (daysToShow - i) / daysToShow;
            const randomVariation = (Math.random() - 0.5) * 0.02; // ±1% random variation
            const growthFactor = 1 + (progress * ((totalValue - totalCost) / totalCost)) + randomVariation;

            data.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(totalCost * growthFactor),
                cost: totalCost,
            });
        }

        return data;
    }, [holdings]);

    // Generate allocation chart data
    const allocationData = useMemo(() => {
        const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);

        return holdings
            .map(holding => ({
                symbol: holding.symbol,
                name: holding.name,
                value: holding.marketValue,
                percentage: (holding.marketValue / totalValue) * 100,
            }))
            .sort((a, b) => b.value - a.value);
    }, [holdings]);

    if (isLoading) {
        return (
            <div className={styles.dashboardLayout}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%' }}>
                    <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboardLayout}>
            {/* Sidebar overlay for mobile */}
            <div
                className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOverlayVisible : ""}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.sidebarHeader}>
                    <Link href="/dashboard" className={styles.sidebarLogo}>
                        <div className={styles.sidebarLogoIcon}>💵</div>
                        <span className={styles.sidebarLogoText}>DFDII</span>
                    </Link>
                </div>

                <nav className={styles.sidebarNav} onClick={() => setSidebarOpen(false)}>
                    <Link href="/dashboard" className={`${styles.navItem} ${styles.navItemActive}`}>
                        <span className={styles.navIcon}>📊</span>
                        Dashboard
                    </Link>
                    <Link href="/member-equity" className={styles.navItem}>
                        <span className={styles.navIcon}>🥧</span>
                        Member Equity
                    </Link>
                    <Link href="/club-values" className={styles.navItem}>
                        <span className={styles.navIcon}>🧾</span>
                        Club Values
                    </Link>
                    {user?.role === "ADMIN" && (
                        <Link href="/members" className={styles.navItem}>
                            <span className={styles.navIcon}>👥</span>
                            Members
                        </Link>
                    )}
                    <Link href="/settings" className={styles.navItem}>
                        <span className={styles.navIcon}>⚙️</span>
                        Settings
                    </Link>
                    {user?.role === "ADMIN" && (
                        <Link href="/admin/users" className={styles.navItem}>
                            <span className={styles.navIcon}>🔐</span>
                            Admin Panel
                        </Link>
                    )}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo} onClick={handleSignOut} title="Click to sign out">
                        <div className={styles.userAvatar}>
                            {user?.name ? getInitials(user.name) : "U"}
                        </div>
                        <div className={styles.userDetails}>
                            <div className={styles.userName}>{user?.name || "User"}</div>
                            <div className={styles.userRole}>{user?.role || "Member"}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                            <button className={styles.menuButton} onClick={() => setSidebarOpen(true)}>
                                ☰
                            </button>
                            <h1 className={styles.pageTitle}>Dashboard</h1>
                        </div>
                        <div className={styles.headerActions}>
                            <div className={styles.dateTimeWidget}>
                                <div>{now.toLocaleDateString()}</div>
                                <div>{now.toLocaleTimeString()}</div>
                            </div>
                            <StockSearch />
                        </div>
                    </div>
                </header>

                {/* Stock Ticker */}
                <StockTicker holdings={holdings} livePrices={livePrices} />

                <div className={styles.pageContent}>
                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        {stats.map((stat, index) => (
                            <div key={index} className={styles.statCard}>
                                <div className={styles.statCardHeader}>
                                    <span className={styles.statCardLabel}>{stat.label}</span>
                                    <div className={styles.statCardIcon}>{stat.icon}</div>
                                </div>
                                <div className={styles.statCardValue}>{stat.value}</div>
                                <div className={`${styles.statCardChange} ${stat.positive ? styles.positive : styles.negative}`}>
                                    {stat.change}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Section */}
                    <div className={styles.chartsGrid}>
                        {/* Performance Chart */}
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <h2 className={styles.chartTitle}>Portfolio Performance</h2>
                                <span className={styles.chartSubtitle}>Last 30 days</span>
                            </div>
                            <div className={styles.chartContainer}>
                                <PortfolioPerformanceChart data={performanceData} height={300} />
                            </div>
                        </div>

                        {/* Allocation Chart */}
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <h2 className={styles.chartTitle}>Portfolio Allocation</h2>
                                <span className={styles.chartSubtitle}>All holdings by market value</span>
                            </div>
                            <div className={styles.chartContainer}>
                                <PortfolioAllocationChart data={allocationData} height={300} />
                            </div>
                        </div>
                    </div>

                    {/* DFDII Holdings Table */}
                    <div className={styles.holdingsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Dining for Dollars II Stock Holdings</h2>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                {pricesLoading ? "Updating prices..." : `${filteredAndSortedHoldings.length} holdings`}
                            </span>
                        </div>

                        <div className={dfdiiStyles.controls}>
                            <input
                                type="text"
                                placeholder="Search by symbol..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={dfdiiStyles.searchInput}
                            />
                        </div>

                        <div className={dfdiiStyles.tableContainer}>
                            <table className={dfdiiStyles.table}>
                                <thead>
                                    <tr>
                                        <th className={dfdiiStyles.stickyColumn} onClick={() => handleSort("symbol")}>
                                            Symbol {renderSortIndicator("symbol")}
                                        </th>
                                        <th onClick={() => handleSort("qty")} style={{ textAlign: "right" }}>
                                            Qty {renderSortIndicator("qty")}
                                        </th>
                                        <th onClick={() => handleSort("price")} style={{ textAlign: "right" }}>
                                            Price {renderSortIndicator("price")}
                                        </th>
                                        <th onClick={() => handleSort("date")}>
                                            Date {renderSortIndicator("date")}
                                        </th>
                                        <th onClick={() => handleSort("lastPrice")} style={{ textAlign: "right" }}>
                                            Last {renderSortIndicator("lastPrice")}
                                        </th>
                                        <th onClick={() => handleSort("costBasis")} style={{ textAlign: "right" }}>
                                            Cost Basis {renderSortIndicator("costBasis")}
                                        </th>
                                        <th onClick={() => handleSort("marketValue")} style={{ textAlign: "right" }}>
                                            Mkt Val {renderSortIndicator("marketValue")}
                                        </th>
                                        <th
                                            onClick={() => {
                                                setShowDayChangePercent(!showDayChangePercent);
                                                handleSort(showDayChangePercent ? "dayChange" : "dayChangePercent");
                                            }}
                                            style={{ textAlign: "right", cursor: "pointer" }}
                                            className={dfdiiStyles.toggleHeader}
                                            title="Click to toggle between $ and %"
                                        >
                                            Day {showDayChangePercent ? "%" : "$"} {renderSortIndicator(showDayChangePercent ? "dayChangePercent" : "dayChange")}
                                        </th>
                                        <th onClick={() => handleSort("gainDollar")} style={{ textAlign: "right" }}>
                                            Gain ($) {renderSortIndicator("gainDollar")}
                                        </th>
                                        <th onClick={() => handleSort("gainPercent")} style={{ textAlign: "right" }}>
                                            Gain (%) {renderSortIndicator("gainPercent")}
                                        </th>
                                        <th onClick={() => handleSort("dividends")} style={{ textAlign: "right" }}>
                                            Dividends {renderSortIndicator("dividends")}
                                        </th>
                                        <th onClick={() => handleSort("return")} style={{ textAlign: "right" }}>
                                            Return {renderSortIndicator("return")}
                                        </th>
                                        <th onClick={() => handleSort("returnPercent")} style={{ textAlign: "right" }}>
                                            Return% {renderSortIndicator("returnPercent")}
                                        </th>
                                        <th style={{ textAlign: "right" }}>Months</th>
                                        <th onClick={() => handleSort("returnPerMonth")} style={{ textAlign: "right" }}>
                                            Ret%/M {renderSortIndicator("returnPerMonth")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedHoldings.map((holding) => (
                                        <tr key={holding.symbol}>
                                            <td className={dfdiiStyles.stickyColumn}>
                                                <Link href={`/stock/${holding.symbol}`} className={dfdiiStyles.symbolLink}>
                                                    {holding.symbol}
                                                </Link>
                                            </td>
                                            <td style={{ textAlign: "right" }}>{formatNumber(holding.qty)}</td>
                                            <td style={{ textAlign: "right" }}>{formatCurrencyDetailed(holding.price)}</td>
                                            <td>{holding.date}</td>
                                            <td style={{ textAlign: "right" }}>
                                                <span className={dfdiiStyles.livePrice}>{formatCurrencyDetailed(holding.lastPrice)}</span>
                                            </td>
                                            <td style={{ textAlign: "right" }}>{formatCurrencyDetailed(holding.costBasis)}</td>
                                            <td style={{ textAlign: "right" }}>{formatCurrencyDetailed(holding.marketValue)}</td>
                                            <td style={{ textAlign: "right" }} className={holding.dayChange && holding.dayChange >= 0 ? dfdiiStyles.positive : dfdiiStyles.negative}>
                                                {showDayChangePercent ? formatPercentDetailed(holding.dayChangePercent) : formatCurrencyDetailed(holding.dayChange)}
                                            </td>
                                            <td style={{ textAlign: "right" }} className={holding.gainDollar && holding.gainDollar >= 0 ? dfdiiStyles.positive : dfdiiStyles.negative}>
                                                {formatCurrencyDetailed(holding.gainDollar)}
                                            </td>
                                            <td style={{ textAlign: "right" }} className={holding.gainPercent && holding.gainPercent >= 0 ? dfdiiStyles.positive : dfdiiStyles.negative}>
                                                {formatPercentDetailed(holding.gainPercent)}
                                            </td>
                                            <td style={{ textAlign: "right" }}>{formatCurrencyDetailed(holding.dividends)}</td>
                                            <td style={{ textAlign: "right" }} className={holding.return && holding.return >= 0 ? dfdiiStyles.positive : dfdiiStyles.negative}>
                                                {formatCurrencyDetailed(holding.return)}
                                            </td>
                                            <td style={{ textAlign: "right" }} className={holding.returnPercent && holding.returnPercent >= 0 ? dfdiiStyles.positive : dfdiiStyles.negative}>
                                                {formatPercentDetailed(holding.returnPercent)}
                                            </td>
                                            <td style={{ textAlign: "right" }}>{holding.monthsHeld}</td>
                                            <td style={{ textAlign: "right" }} className={holding.returnPerMonth && holding.returnPerMonth >= 0 ? dfdiiStyles.positive : dfdiiStyles.negative}>
                                                {formatPercentDetailed(holding.returnPerMonth)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className={dfdiiStyles.totalRow}>
                                        <td colSpan={6}><strong>TOTALS</strong></td>
                                        <td style={{ textAlign: "right" }}><strong>{formatCurrencyDetailed(holdingsTotals.marketValue)}</strong></td>
                                        <td style={{ textAlign: "right" }} className={holdingsTotals.dayChange >= 0 ? dfdiiStyles.positive : dfdiiStyles.negative}>
                                            <strong>{showDayChangePercent ? formatPercentDetailed(holdingsTotals.dayChangePercent) : formatCurrencyDetailed(holdingsTotals.dayChange)}</strong>
                                        </td>
                                        <td style={{ textAlign: "right" }} className={holdingsTotals.gainDollar >= 0 ? dfdiiStyles.positive : dfdiiStyles.negative}>
                                            <strong>{formatCurrencyDetailed(holdingsTotals.gainDollar)}</strong>
                                        </td>
                                        <td style={{ textAlign: "right" }} className={holdingsTotals.gainPercent >= 0 ? dfdiiStyles.positive : dfdiiStyles.negative}>
                                            <strong>{formatPercentDetailed(holdingsTotals.gainPercent)}</strong>
                                        </td>
                                        <td style={{ textAlign: "right" }}><strong>{formatCurrencyDetailed(holdingsTotals.dividends)}</strong></td>
                                        <td style={{ textAlign: "right" }} className={holdingsTotals.return >= 0 ? dfdiiStyles.positive : dfdiiStyles.negative}>
                                            <strong>{formatCurrencyDetailed(holdingsTotals.return)}</strong>
                                        </td>
                                        <td style={{ textAlign: "right" }} className={holdingsTotals.returnPercent >= 0 ? dfdiiStyles.positive : dfdiiStyles.negative}>
                                            <strong>{formatPercentDetailed(holdingsTotals.returnPercent)}</strong>
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import styles from "../dashboard.module.css";
import { PortfolioData, Holding } from "@/lib/types";
import PortfolioPerformanceChart from "@/components/charts/PortfolioPerformanceChart";
import PortfolioAllocationChart from "@/components/charts/PortfolioAllocationChart";
import StockTicker from "@/components/StockTicker";

// Sample data - used when no Schwab data is uploaded
const sampleStats = [
    { label: "Portfolio Value", value: "$124,850", change: "+12.4%", positive: true, icon: "💰" },
    { label: "Today's Change", value: "+$1,247", change: "+1.01%", positive: true, icon: "📈" },
    { label: "Total Gain/Loss", value: "+$18,420", change: "+17.3%", positive: true, icon: "🎯" },
    { label: "Cash Balance", value: "$4,230", change: "3.4% of portfolio", positive: true, icon: "💵" },
];

const sampleHoldings: Holding[] = [
    { symbol: "AAPL", name: "Apple Inc.", quantity: 50, costPerShare: 145.20, currentPrice: 178.50, marketValue: 8925, gainLoss: 1665, gainLossPercent: 22.9 },
    { symbol: "MSFT", name: "Microsoft Corp.", quantity: 30, costPerShare: 280.00, currentPrice: 378.91, marketValue: 11367.3, gainLoss: 2967.3, gainLossPercent: 35.3 },
    { symbol: "GOOGL", name: "Alphabet Inc.", quantity: 15, costPerShare: 120.50, currentPrice: 141.80, marketValue: 2127, gainLoss: 319.5, gainLossPercent: 17.7 },
    { symbol: "NVDA", name: "NVIDIA Corp.", quantity: 20, costPerShare: 450.00, currentPrice: 875.28, marketValue: 17505.6, gainLoss: 8505.6, gainLossPercent: 94.5 },
    { symbol: "AMZN", name: "Amazon.com Inc.", quantity: 25, costPerShare: 145.00, currentPrice: 178.25, marketValue: 4456.25, gainLoss: 831.25, gainLossPercent: 22.9 },
];

export default function DashboardPage() {
    const { data: session } = useSession();
    const user = session?.user;
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasRealData, setHasRealData] = useState(false);

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

    const formatPercent = (value: number) => {
        return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
    };

    // Determine which data to display
    const holdings = hasRealData && portfolioData ? portfolioData.holdings : sampleHoldings;
    const stats = hasRealData && portfolioData
        ? [
            { label: "Portfolio Value", value: formatCurrency(portfolioData.totalValue), change: formatPercent(portfolioData.totalGainLossPercent), positive: portfolioData.totalGainLossPercent >= 0, icon: "💰" },
            { label: "Today's Change", value: "--", change: "Refresh for live data", positive: true, icon: "📈" },
            { label: "Total Gain/Loss", value: formatCurrency(portfolioData.totalGainLoss), change: formatPercent(portfolioData.totalGainLossPercent), positive: portfolioData.totalGainLoss >= 0, icon: "🎯" },
            { label: "Holdings", value: String(portfolioData.holdings.length), change: "positions", positive: true, icon: "📊" },
        ]
        : sampleStats;

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
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10 holdings for cleaner chart
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
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Link href="/dashboard" className={styles.sidebarLogo}>
                        <div className={styles.sidebarLogoIcon}>💵</div>
                        <span className={styles.sidebarLogoText}>DFDII</span>
                    </Link>
                </div>

                <nav className={styles.sidebarNav}>
                    <Link href="/dashboard" className={`${styles.navItem} ${styles.navItemActive}`}>
                        <span className={styles.navIcon}>📊</span>
                        Dashboard
                    </Link>
                    <Link href="/portfolio" className={styles.navItem}>
                        <span className={styles.navIcon}>💼</span>
                        Portfolio
                    </Link>
                    <Link href="/transactions" className={styles.navItem}>
                        <span className={styles.navIcon}>📋</span>
                        Transactions
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
                        <h1 className={styles.pageTitle}>Dashboard</h1>
                        <div className={styles.headerActions}>
                            {hasRealData ? (
                                <span style={{ color: 'var(--color-success)', fontSize: '0.875rem' }}>
                                    ✓ Using Schwab data
                                </span>
                            ) : (
                                <Link href="/settings" style={{ color: 'var(--color-accent-primary)', fontSize: '0.875rem' }}>
                                    Import Schwab Data →
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                {/* Stock Ticker */}
                <StockTicker holdings={holdings} />

                <div className={styles.pageContent}>
                    {/* Sample Data Notice */}
                    {!hasRealData && (
                        <div style={{
                            padding: 'var(--space-md)',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-xl)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                📊 Showing sample data. <strong>Import your Schwab portfolio</strong> to see real holdings.
                            </span>
                            <Link href="/settings" className="btn btn-primary" style={{ padding: 'var(--space-sm) var(--space-md)', fontSize: '0.875rem' }}>
                                Import Data
                            </Link>
                        </div>
                    )}

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
                                <span className={styles.chartSubtitle}>Top 10 holdings</span>
                            </div>
                            <div className={styles.chartContainer}>
                                <PortfolioAllocationChart data={allocationData} height={300} />
                            </div>
                        </div>
                    </div>

                    {/* Holdings Table */}
                    <div className={styles.holdingsSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                {hasRealData ? "Your Holdings" : "Sample Holdings"}
                            </h2>
                            <Link href="/portfolio" style={{ color: 'var(--color-accent-primary)', fontSize: '0.875rem' }}>
                                View All →
                            </Link>
                        </div>
                        <table className={styles.holdingsTable}>
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th>Shares</th>
                                    <th>Avg Cost</th>
                                    <th>Current Price</th>
                                    <th>Gain/Loss</th>
                                    <th>Total Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.slice(0, 5).map((stock) => (
                                    <tr key={stock.symbol}>
                                        <td>
                                            <div className={styles.stockSymbol}>{stock.symbol}</div>
                                            <div className={styles.stockName}>{stock.name}</div>
                                        </td>
                                        <td>{stock.quantity.toFixed(2)}</td>
                                        <td className={styles.stockPrice}>${stock.costPerShare.toFixed(2)}</td>
                                        <td className={styles.stockPrice}>${stock.currentPrice.toFixed(2)}</td>
                                        <td className={stock.gainLossPercent >= 0 ? styles.positive : styles.negative}>
                                            {stock.gainLossPercent >= 0 ? '+' : ''}{stock.gainLossPercent.toFixed(2)}%
                                        </td>
                                        <td className={styles.stockPrice}>
                                            ${stock.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {holdings.length > 5 && (
                            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: 'var(--space-md)', fontSize: '0.875rem' }}>
                                <Link href="/portfolio" style={{ color: 'var(--color-accent-primary)' }}>
                                    View all {holdings.length} holdings →
                                </Link>
                            </p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

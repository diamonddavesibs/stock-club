"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import dashStyles from "../../dashboard.module.css";
import styles from "./stock.module.css";
import { Holding } from "@/lib/types";

interface LiveQuote {
    currentPrice: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
}

interface CandlePoint {
    date: string;
    close: number;
}

interface StockDetailsData {
    longName?: string;
    sector?: string;
    industry?: string;
    website?: string;
    description?: string;
    marketCap?: number;
    trailingPE?: number;
    forwardPE?: number;
    eps?: number;
    dividendYield?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    volume?: number;
    avgVolume?: number;
    beta?: number;
    recommendations?: {
        strongBuy: number;
        buy: number;
        hold: number;
        sell: number;
        strongSell: number;
    };
}

const RANGES = ["5D", "1W", "1M", "3M", "6M", "1Y"] as const;

export default function StockDetailPage() {
    const params = useParams();
    const symbol = (params.symbol as string)?.toUpperCase() || "";
    const { data: session } = useSession();
    const user = session?.user;

    const [holding, setHolding] = useState<Holding | null>(null);
    const [quote, setQuote] = useState<LiveQuote | null>(null);
    const [details, setDetails] = useState<StockDetailsData | null>(null);
    const [candles, setCandles] = useState<CandlePoint[]>([]);
    const [range, setRange] = useState<string>("1M");
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);

    // Fetch holding data from portfolio
    useEffect(() => {
        const fetchHolding = async () => {
            try {
                const res = await fetch("/api/portfolio");
                if (res.ok) {
                    const { portfolio } = await res.json();
                    const found = portfolio?.holdings?.find(
                        (h: Holding) => h.symbol === symbol
                    );
                    if (found) setHolding(found);
                }
            } catch (err) {
                console.error("Failed to fetch holding:", err);
            }
        };
        if (symbol) fetchHolding();
    }, [symbol]);

    // Fetch live quote
    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const res = await fetch("/api/stock-prices", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ symbols: [symbol] }),
                });
                if (res.ok) {
                    const data = await res.json();
                    const q = data.quotes?.[symbol];
                    if (q) {
                        setQuote({
                            currentPrice: q.currentPrice,
                            change: q.change,
                            changePercent: q.changePercent,
                            high: q.high,
                            low: q.low,
                            open: q.open,
                            previousClose: q.previousClose,
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch quote:", err);
            } finally {
                setLoading(false);
            }
        };
        if (symbol) fetchQuote();
    }, [symbol]);

    // Fetch stock details
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch(`/api/stock-details?symbol=${symbol}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.details) setDetails(data.details);
                }
            } catch (err) {
                console.error("Failed to fetch stock details:", err);
            }
        };
        if (symbol) fetchDetails();
    }, [symbol]);

    // Fetch candle data
    const fetchCandles = useCallback(async (r: string) => {
        setChartLoading(true);
        try {
            const res = await fetch(`/api/stock-candles?symbol=${symbol}&range=${r}`);
            if (res.ok) {
                const data = await res.json();
                setCandles(
                    (data.candles || []).map((c: { date: string; close: number }) => ({
                        date: c.date,
                        close: c.close,
                    }))
                );
            }
        } catch (err) {
            console.error("Failed to fetch candles:", err);
        } finally {
            setChartLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        if (symbol) fetchCandles(range);
    }, [symbol, range, fetchCandles]);

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const getInitials = (name: string) =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const formatCurrency = (val: number) =>
        val.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

    const formatLargeNumber = (val: number) => {
        if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
        return `$${val.toLocaleString()}`;
    };

    const formatVolume = (val: number) => {
        if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
        if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
        return val.toLocaleString();
    };

    const price = quote?.currentPrice ?? holding?.currentPrice ?? 0;
    const change = quote?.change ?? 0;
    const changePercent = quote?.changePercent ?? 0;
    const isPositive = change >= 0;

    // Holdings calculations
    const quantity = holding?.quantity ?? 0;
    const costPerShare = holding?.costPerShare ?? 0;
    const totalCost = quantity * costPerShare;
    const currentValue = quantity * price;
    const gainLoss = currentValue - totalCost;
    const returnPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

    const companyName = details?.longName ?? holding?.name;

    // Recommendation bar
    const rec = details?.recommendations;
    const totalRec = rec ? rec.strongBuy + rec.buy + rec.hold + rec.sell + rec.strongSell : 0;

    return (
        <div className={dashStyles.dashboardLayout}>
            {/* Sidebar */}
            <aside className={dashStyles.sidebar}>
                <div className={dashStyles.sidebarHeader}>
                    <Link href="/dashboard" className={dashStyles.sidebarLogo}>
                        <div className={dashStyles.sidebarLogoIcon}>$</div>
                        <span className={dashStyles.sidebarLogoText}>DFDII</span>
                    </Link>
                </div>
                <nav className={dashStyles.sidebarNav}>
                    <Link href="/dashboard" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>📊</span> Dashboard
                    </Link>
                    <Link href="/portfolio" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>💼</span> Portfolio
                    </Link>
                    <Link href="/transactions" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>📋</span> Transactions
                    </Link>
                    {user?.role === "ADMIN" && (
                        <Link href="/members" className={dashStyles.navItem}>
                            <span className={dashStyles.navIcon}>👥</span> Members
                        </Link>
                    )}
                    <Link href="/settings" className={dashStyles.navItem}>
                        <span className={dashStyles.navIcon}>⚙️</span> Settings
                    </Link>
                    {user?.role === "ADMIN" && (
                        <Link href="/admin/users" className={dashStyles.navItem}>
                            <span className={dashStyles.navIcon}>🔐</span> Admin Panel
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
                <div className={dashStyles.pageContent}>
                    <Link href="/dashboard" className={styles.backLink}>
                        ← Back to Dashboard
                    </Link>

                    {loading ? (
                        <div className={styles.loadingState}>Loading stock data...</div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className={styles.stockHeader}>
                                <div>
                                    <span className={styles.symbolTitle}>{symbol}</span>
                                    {companyName && (
                                        <span className={styles.companyName}> {companyName}</span>
                                    )}
                                    {details?.sector && (
                                        <div className={styles.sectorBadge}>
                                            {details.sector}{details.industry ? ` · ${details.industry}` : ""}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.priceSection}>
                                    <span className={styles.currentPrice}>{formatCurrency(price)}</span>
                                    <span className={`${styles.priceChange} ${isPositive ? styles.positive : styles.negative}`}>
                                        {isPositive ? "+" : ""}{change.toFixed(2)} ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
                                    </span>
                                </div>
                            </div>

                            {/* External Research Links */}
                            <div className={styles.researchLinks}>
                                <span className={styles.researchLabel}>Research:</span>
                                <a
                                    href={`https://finance.yahoo.com/quote/${symbol}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.researchBtn}
                                >
                                    Yahoo Finance
                                </a>
                                <a
                                    href={`https://www.morningstar.com/stocks/xnas/${symbol.toLowerCase()}/quote`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.researchBtn}
                                >
                                    Morningstar
                                </a>
                                <a
                                    href={`https://seekingalpha.com/symbol/${symbol}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.researchBtn}
                                >
                                    Seeking Alpha
                                </a>
                                <a
                                    href={`https://www.google.com/finance/quote/${symbol}:NASDAQ`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.researchBtn}
                                >
                                    Google Finance
                                </a>
                            </div>

                            {/* Chart */}
                            <div className={styles.chartCard}>
                                <div className={styles.chartHeader}>
                                    <span className={styles.chartTitle}>Price History</span>
                                    <div className={styles.rangeButtons}>
                                        {RANGES.map((r) => (
                                            <button
                                                key={r}
                                                className={`${styles.rangeBtn} ${range === r ? styles.rangeBtnActive : ""}`}
                                                onClick={() => setRange(r)}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {chartLoading ? (
                                    <div className={styles.chartPlaceholder}>Loading chart data...</div>
                                ) : candles.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <LineChart data={candles}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 12, fill: "#888" }}
                                                tickFormatter={(d: string) => {
                                                    const date = new Date(d);
                                                    return `${date.getMonth() + 1}/${date.getDate()}`;
                                                }}
                                            />
                                            <YAxis
                                                domain={["auto", "auto"]}
                                                tick={{ fontSize: 12, fill: "#888" }}
                                                tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: "#1a1a2e",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius: "8px",
                                                    color: "#fff",
                                                }}
                                                formatter={(value?: number) => [formatCurrency(value ?? 0), "Price"]}
                                                labelFormatter={(label: unknown) => {
                                                    const d = new Date(String(label));
                                                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                                                }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="close"
                                                stroke="#6366f1"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 4, fill: "#6366f1" }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className={styles.chartPlaceholder}>
                                        No chart data available for {symbol}
                                    </div>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className={styles.detailsGrid}>
                                {/* Quote Details */}
                                <div className={styles.detailCard}>
                                    <h3 className={styles.detailCardTitle}>Quote Details</h3>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Open</span>
                                        <span className={styles.detailValue}>{formatCurrency(quote?.open ?? 0)}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>High</span>
                                        <span className={styles.detailValue}>{formatCurrency(quote?.high ?? 0)}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Low</span>
                                        <span className={styles.detailValue}>{formatCurrency(quote?.low ?? 0)}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Previous Close</span>
                                        <span className={styles.detailValue}>{formatCurrency(quote?.previousClose ?? 0)}</span>
                                    </div>
                                </div>

                                {/* Key Statistics */}
                                {details && (
                                    <div className={styles.detailCard}>
                                        <h3 className={styles.detailCardTitle}>Key Statistics</h3>
                                        {details.marketCap != null && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Market Cap</span>
                                                <span className={styles.detailValue}>{formatLargeNumber(details.marketCap)}</span>
                                            </div>
                                        )}
                                        {details.trailingPE != null && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>P/E (TTM)</span>
                                                <span className={styles.detailValue}>{details.trailingPE.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {details.forwardPE != null && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Forward P/E</span>
                                                <span className={styles.detailValue}>{details.forwardPE.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {details.eps != null && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>EPS (TTM)</span>
                                                <span className={styles.detailValue}>{formatCurrency(details.eps)}</span>
                                            </div>
                                        )}
                                        {details.dividendYield != null && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Dividend Yield</span>
                                                <span className={styles.detailValue}>{(details.dividendYield * 100).toFixed(2)}%</span>
                                            </div>
                                        )}
                                        {details.beta != null && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Beta</span>
                                                <span className={styles.detailValue}>{details.beta.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {details.fiftyTwoWeekHigh != null && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>52W High</span>
                                                <span className={styles.detailValue}>{formatCurrency(details.fiftyTwoWeekHigh)}</span>
                                            </div>
                                        )}
                                        {details.fiftyTwoWeekLow != null && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>52W Low</span>
                                                <span className={styles.detailValue}>{formatCurrency(details.fiftyTwoWeekLow)}</span>
                                            </div>
                                        )}
                                        {details.volume != null && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Volume</span>
                                                <span className={styles.detailValue}>{formatVolume(details.volume)}</span>
                                            </div>
                                        )}
                                        {details.avgVolume != null && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Avg Volume</span>
                                                <span className={styles.detailValue}>{formatVolume(details.avgVolume)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Holdings Details */}
                                {holding && (
                                    <div className={styles.detailCard}>
                                        <h3 className={styles.detailCardTitle}>Your Holdings</h3>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Shares</span>
                                            <span className={styles.detailValue}>{quantity.toFixed(2)}</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Cost Per Share</span>
                                            <span className={styles.detailValue}>{formatCurrency(costPerShare)}</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Total Cost</span>
                                            <span className={styles.detailValue}>{formatCurrency(totalCost)}</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Current Value</span>
                                            <span className={styles.detailValue}>{formatCurrency(currentValue)}</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Gain/Loss</span>
                                            <span className={`${styles.detailValue} ${gainLoss >= 0 ? styles.positive : styles.negative}`}>
                                                {gainLoss >= 0 ? "+" : ""}{formatCurrency(gainLoss)}
                                            </span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.detailLabel}>Return</span>
                                            <span className={`${styles.detailValue} ${returnPct >= 0 ? styles.positive : styles.negative}`}>
                                                {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Analyst Recommendations */}
                            {rec && totalRec > 0 && (
                                <div className={styles.detailCard} style={{ marginBottom: "var(--space-xl)" }}>
                                    <h3 className={styles.detailCardTitle}>Analyst Recommendations</h3>
                                    <div className={styles.recBar}>
                                        {rec.strongBuy > 0 && (
                                            <div
                                                className={styles.recSegment}
                                                style={{ width: `${(rec.strongBuy / totalRec) * 100}%`, background: "#16a34a" }}
                                                title={`Strong Buy: ${rec.strongBuy}`}
                                            />
                                        )}
                                        {rec.buy > 0 && (
                                            <div
                                                className={styles.recSegment}
                                                style={{ width: `${(rec.buy / totalRec) * 100}%`, background: "#4ade80" }}
                                                title={`Buy: ${rec.buy}`}
                                            />
                                        )}
                                        {rec.hold > 0 && (
                                            <div
                                                className={styles.recSegment}
                                                style={{ width: `${(rec.hold / totalRec) * 100}%`, background: "#facc15" }}
                                                title={`Hold: ${rec.hold}`}
                                            />
                                        )}
                                        {rec.sell > 0 && (
                                            <div
                                                className={styles.recSegment}
                                                style={{ width: `${(rec.sell / totalRec) * 100}%`, background: "#f97316" }}
                                                title={`Sell: ${rec.sell}`}
                                            />
                                        )}
                                        {rec.strongSell > 0 && (
                                            <div
                                                className={styles.recSegment}
                                                style={{ width: `${(rec.strongSell / totalRec) * 100}%`, background: "#ef4444" }}
                                                title={`Strong Sell: ${rec.strongSell}`}
                                            />
                                        )}
                                    </div>
                                    <div className={styles.recLabels}>
                                        <span style={{ color: "#16a34a" }}>Strong Buy: {rec.strongBuy}</span>
                                        <span style={{ color: "#4ade80" }}>Buy: {rec.buy}</span>
                                        <span style={{ color: "#facc15" }}>Hold: {rec.hold}</span>
                                        <span style={{ color: "#f97316" }}>Sell: {rec.sell}</span>
                                        <span style={{ color: "#ef4444" }}>Strong Sell: {rec.strongSell}</span>
                                    </div>
                                </div>
                            )}

                            {/* Company Description */}
                            {details?.description && (
                                <div className={styles.detailCard}>
                                    <h3 className={styles.detailCardTitle}>About {companyName || symbol}</h3>
                                    <p className={styles.companyDescription}>{details.description}</p>
                                    {details.website && (
                                        <a
                                            href={details.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.websiteLink}
                                        >
                                            {details.website}
                                        </a>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

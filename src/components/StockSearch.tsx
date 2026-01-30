"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import styles from "../app/(dashboard)/dashboard.module.css";

interface SearchResult {
    symbol: string;
    description: string;
}

interface QuotePreview {
    symbol: string;
    description: string;
    currentPrice: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
}

export default function StockSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [preview, setPreview] = useState<QuotePreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
                setPreview(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setShowDropdown(false);
                setPreview(null);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const search = useCallback(async (q: string) => {
        if (q.trim().length === 0) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        setSearching(true);
        try {
            const res = await fetch(`/api/stock-search?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.results || []);
                setShowDropdown(true);
            }
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleInputChange = (value: string) => {
        setQuery(value);
        setPreview(null);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(value), 300);
    };

    const handleResultClick = async (result: SearchResult) => {
        setShowDropdown(false);
        setPreviewLoading(true);
        setPreview(null);
        setPreviewError(null);

        try {
            const res = await fetch("/api/stock-prices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ symbols: [result.symbol] }),
            });

            if (!res.ok) {
                setPreviewError("Failed to fetch quote");
                return;
            }

            const data = await res.json();
            const quote = data.quotes?.[result.symbol];
            if (quote) {
                setPreview({
                    symbol: result.symbol,
                    description: result.description,
                    currentPrice: quote.currentPrice,
                    change: quote.change,
                    changePercent: quote.changePercent,
                    high: quote.high,
                    low: quote.low,
                    open: quote.open,
                    previousClose: quote.previousClose,
                });
            } else {
                setPreviewError("No quote data available");
            }
        } catch {
            setPreviewError("Network error");
        } finally {
            setPreviewLoading(false);
        }
    };

    const formatCurrency = (v: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

    return (
        <div className={styles.searchWrapper} ref={containerRef}>
            <input
                type="text"
                placeholder="Search stocks..."
                className={styles.searchInput}
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            />

            {/* Dropdown results */}
            {showDropdown && results.length > 0 && (
                <div className={styles.searchDropdown}>
                    {results.map((r) => (
                        <button
                            key={r.symbol}
                            className={styles.searchResultItem}
                            onClick={() => handleResultClick(r)}
                        >
                            <span className={styles.searchResultSymbol}>{r.symbol}</span>
                            <span className={styles.searchResultName}>{r.description}</span>
                        </button>
                    ))}
                </div>
            )}

            {showDropdown && results.length === 0 && !searching && query.trim().length > 0 && (
                <div className={styles.searchDropdown}>
                    <div className={styles.searchNoResults}>No results found</div>
                </div>
            )}

            {/* Preview card */}
            {(preview || previewLoading || previewError) && (
                <div className={styles.previewCard}>
                    {previewLoading ? (
                        <div className={styles.previewLoading}>Loading quote...</div>
                    ) : previewError ? (
                        <div className={styles.previewLoading}>{previewError}</div>
                    ) : preview && (
                        <>
                            <div className={styles.previewHeader}>
                                <div>
                                    <div className={styles.previewSymbol}>{preview.symbol}</div>
                                    <div className={styles.previewName}>{preview.description}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div className={styles.previewPrice}>{formatCurrency(preview.currentPrice)}</div>
                                    <div className={preview.change >= 0 ? styles.positive : styles.negative}>
                                        {preview.change >= 0 ? "+" : ""}{formatCurrency(preview.change)} ({preview.changePercent >= 0 ? "+" : ""}{preview.changePercent.toFixed(2)}%)
                                    </div>
                                </div>
                            </div>
                            <div className={styles.previewDetails}>
                                <div className={styles.previewRow}>
                                    <span>Open</span><span>{formatCurrency(preview.open)}</span>
                                </div>
                                <div className={styles.previewRow}>
                                    <span>High</span><span>{formatCurrency(preview.high)}</span>
                                </div>
                                <div className={styles.previewRow}>
                                    <span>Low</span><span>{formatCurrency(preview.low)}</span>
                                </div>
                                <div className={styles.previewRow}>
                                    <span>Prev Close</span><span>{formatCurrency(preview.previousClose)}</span>
                                </div>
                            </div>
                            <Link
                                href={`/stock/${preview.symbol}`}
                                className={styles.previewLink}
                                onClick={() => { setPreview(null); setQuery(""); }}
                            >
                                View full details →
                            </Link>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

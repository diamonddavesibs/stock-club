"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "../app/(dashboard)/dashboard.module.css";

interface SearchResult {
    symbol: string;
    description: string;
}

export default function StockSearch() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
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
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(value), 300);
    };

    const handleResultClick = (result: SearchResult) => {
        setShowDropdown(false);
        setQuery("");
        setResults([]);
        router.push(`/stock/${result.symbol}`);
    };

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
        </div>
    );
}

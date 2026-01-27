"use client";

import { useMemo } from "react";
import styles from "./StockTicker.module.css";
import { Holding } from "@/lib/types";

interface StockTickerProps {
    holdings: Holding[];
}

export default function StockTicker({ holdings }: StockTickerProps) {
    // Duplicate holdings for seamless infinite scroll
    const tickerItems = useMemo(() => {
        if (holdings.length === 0) return [];
        // Duplicate the array to create seamless loop
        return [...holdings, ...holdings];
    }, [holdings]);

    if (holdings.length === 0) {
        return null;
    }

    const formatPrice = (price: number) => {
        return price.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        });
    };

    const formatPercent = (value: number) => {
        const sign = value >= 0 ? "+" : "";
        return `${sign}${value.toFixed(2)}%`;
    };

    return (
        <div className={styles.tickerWrapper}>
            <div className={styles.tickerTrack}>
                <div className={styles.tickerContent}>
                    {tickerItems.map((holding, index) => (
                        <div key={`${holding.symbol}-${index}`} className={styles.tickerItem}>
                            <span className={styles.tickerSymbol}>{holding.symbol}</span>
                            <span className={styles.tickerPrice}>
                                {formatPrice(holding.currentPrice)}
                            </span>
                            <span
                                className={`${styles.tickerChange} ${
                                    holding.gainLossPercent >= 0
                                        ? styles.positive
                                        : styles.negative
                                }`}
                            >
                                {formatPercent(holding.gainLossPercent)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

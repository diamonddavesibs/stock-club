"use client";

import { useMemo } from "react";
import styles from "./StockTicker.module.css";
import { Holding } from "@/lib/types";

interface LivePrice {
    currentPrice: number;
    change: number;
    changePercent: number;
    previousClose: number;
}

interface StockTickerProps {
    holdings: Holding[];
    livePrices?: Record<string, LivePrice>;
}

export default function StockTicker({ holdings, livePrices = {} }: StockTickerProps) {
    const tickerItems = useMemo(() => {
        if (holdings.length === 0) return [];
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

    const formatChange = (value: number) => {
        const sign = value >= 0 ? "+" : "";
        return `${sign}${value.toFixed(2)}`;
    };

    return (
        <div className={styles.tickerWrapper}>
            <div className={styles.tickerTrack}>
                <div className={styles.tickerContent}>
                    {tickerItems.map((holding, index) => {
                        const live = livePrices[holding.symbol];
                        const price = live?.currentPrice || holding.currentPrice;
                        const dailyChange = live?.change ?? 0;
                        const dailyChangePercent = live?.changePercent ?? 0;

                        return (
                            <div key={`${holding.symbol}-${index}`} className={styles.tickerItem}>
                                <span className={styles.tickerSymbol}>{holding.symbol}</span>
                                <span className={styles.tickerPrice}>
                                    {formatPrice(price)}
                                </span>
                                <span
                                    className={`${styles.tickerChange} ${
                                        dailyChange >= 0 ? styles.positive : styles.negative
                                    }`}
                                >
                                    {formatPercent(dailyChangePercent)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

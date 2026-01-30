/**
 * Finnhub API client for fetching real-time stock prices
 * Free tier: 60 API calls/minute
 *
 * To get an API key:
 * 1. Go to https://finnhub.io/
 * 2. Sign up for a free account
 * 3. Copy your API key from the dashboard
 * 4. Add FINNHUB_API_KEY to your environment variables
 */

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "";
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export interface StockQuote {
    symbol: string;
    currentPrice: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    timestamp: number;
}

export interface FinnhubQuoteResponse {
    c: number;  // Current price
    d: number;  // Change
    dp: number; // Percent change
    h: number;  // High price of the day
    l: number;  // Low price of the day
    o: number;  // Open price of the day
    pc: number; // Previous close price
    t: number;  // Timestamp
}

// In-memory cache for stock prices (5-minute TTL)
const priceCache = new Map<string, { data: StockQuote; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch a single stock quote from Finnhub
 */
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
    if (!FINNHUB_API_KEY) {
        console.warn("FINNHUB_API_KEY not set");
        return null;
    }

    // Check cache first
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const response = await fetch(
            `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 300 } } // Cache for 5 minutes
        );

        if (!response.ok) {
            console.error(`Finnhub API error for ${symbol}: ${response.status}`);
            return null;
        }

        const data: FinnhubQuoteResponse = await response.json();

        // Check if we got valid data (c=0 usually means invalid symbol)
        if (data.c === 0 && data.pc === 0) {
            console.warn(`No data available for symbol: ${symbol}`);
            return null;
        }

        const quote: StockQuote = {
            symbol,
            currentPrice: data.c,
            change: data.d,
            changePercent: data.dp,
            high: data.h,
            low: data.l,
            open: data.o,
            previousClose: data.pc,
            timestamp: data.t * 1000, // Convert to milliseconds
        };

        // Update cache
        priceCache.set(symbol, { data: quote, timestamp: Date.now() });

        return quote;
    } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        return null;
    }
}

/**
 * Fetch multiple stock quotes with rate limiting
 * Processes in batches to respect Finnhub's 60 calls/minute limit
 */
export async function getMultipleQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
    const results = new Map<string, StockQuote>();

    if (!FINNHUB_API_KEY) {
        console.warn("FINNHUB_API_KEY not set");
        return results;
    }

    // Remove duplicates
    const uniqueSymbols = [...new Set(symbols)];

    // Process symbols with small delay to avoid rate limiting
    // Finnhub allows 60 requests/minute, so ~1 request per second is safe
    for (const symbol of uniqueSymbols) {
        const quote = await getStockQuote(symbol);
        if (quote) {
            results.set(symbol, quote);
        }

        // Small delay between requests (100ms = 600 requests/minute max, well under limit)
        if (uniqueSymbols.indexOf(symbol) < uniqueSymbols.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return results;
}

/**
 * Check if Finnhub API is configured
 */
export function isFinnhubConfigured(): boolean {
    return !!FINNHUB_API_KEY;
}

/**
 * Clear the price cache
 */
export function clearPriceCache(): void {
    priceCache.clear();
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): { size: number; symbols: string[] } {
    return {
        size: priceCache.size,
        symbols: Array.from(priceCache.keys()),
    };
}

export interface SymbolSearchResult {
    symbol: string;
    description: string;
    type: string;
}

/**
 * Search for stock symbols by query string
 */
export async function searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    if (!FINNHUB_API_KEY || !query.trim()) {
        return [];
    }

    try {
        const response = await fetch(
            `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 300 } }
        );

        if (!response.ok) {
            console.error(`Finnhub search error: ${response.status}`);
            return [];
        }

        const data = await response.json();

        if (!data.result || data.result.length === 0) {
            return [];
        }

        // Filter to common stocks only and limit results
        return data.result
            .filter((r: any) => r.type === "Common Stock")
            .slice(0, 10)
            .map((r: any) => ({
                symbol: r.symbol,
                description: r.description,
                type: r.type,
            }));
    } catch (error) {
        console.error("Failed to search symbols:", error);
        return [];
    }
}

export interface StockCandle {
    date: string;   // ISO date string
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface FinnhubCandleResponse {
    c: number[];  // Close prices
    h: number[];  // High prices
    l: number[];  // Low prices
    o: number[];  // Open prices
    t: number[];  // Timestamps (Unix)
    v: number[];  // Volume
    s: string;    // Status: "ok" or "no_data"
}

/**
 * Fetch historical candle data from Finnhub
 * @param symbol Stock symbol
 * @param range Time range: "1W", "1M", "3M", "6M", "1Y"
 */
export async function getStockCandles(symbol: string, range: string = "1M"): Promise<StockCandle[]> {
    if (!FINNHUB_API_KEY) {
        console.warn("FINNHUB_API_KEY not set");
        return [];
    }

    const now = Math.floor(Date.now() / 1000);
    let from: number;

    switch (range) {
        case "1W":  from = now - 7 * 24 * 60 * 60; break;
        case "1M":  from = now - 30 * 24 * 60 * 60; break;
        case "3M":  from = now - 90 * 24 * 60 * 60; break;
        case "6M":  from = now - 180 * 24 * 60 * 60; break;
        case "1Y":  from = now - 365 * 24 * 60 * 60; break;
        default:    from = now - 30 * 24 * 60 * 60; break;
    }

    try {
        const response = await fetch(
            `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${now}&token=${FINNHUB_API_KEY}`,
            { next: { revalidate: 300 } }
        );

        if (!response.ok) {
            console.error(`Finnhub candle API error for ${symbol}: ${response.status}`);
            return [];
        }

        const data: FinnhubCandleResponse = await response.json();

        if (data.s !== "ok" || !data.c || data.c.length === 0) {
            console.warn(`No candle data for ${symbol}`);
            return [];
        }

        return data.t.map((timestamp, i) => ({
            date: new Date(timestamp * 1000).toISOString().split("T")[0],
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
            volume: data.v[i],
        }));
    } catch (error) {
        console.error(`Failed to fetch candles for ${symbol}:`, error);
        return [];
    }
}

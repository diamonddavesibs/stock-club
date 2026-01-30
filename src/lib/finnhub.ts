/**
 * Stock data client using Yahoo Finance APIs
 * No API key required
 */

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

// In-memory cache for stock prices (5-minute TTL)
const priceCache = new Map<string, { data: StockQuote; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch a single stock quote using Yahoo Finance
 */
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
    // Check cache first
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            console.error(`Yahoo Finance quote error for ${symbol}: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];
        const meta = result?.meta;

        if (!meta || !meta.regularMarketPrice) {
            console.warn(`No quote data from Yahoo for ${symbol}`);
            return null;
        }

        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? currentPrice;
        const change = currentPrice - previousClose;
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

        // Get intraday high/low/open from the quote data if available
        const quoteData = result?.indicators?.quote?.[0];
        const high = quoteData?.high?.[0] ?? currentPrice;
        const low = quoteData?.low?.[0] ?? currentPrice;
        const open = quoteData?.open?.[0] ?? previousClose;

        const quote: StockQuote = {
            symbol,
            currentPrice,
            change,
            changePercent,
            high,
            low,
            open,
            previousClose,
            timestamp: Date.now(),
        };

        priceCache.set(symbol, { data: quote, timestamp: Date.now() });
        return quote;
    } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        return null;
    }
}

/**
 * Fetch multiple stock quotes
 */
export async function getMultipleQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
    const results = new Map<string, StockQuote>();
    const uniqueSymbols = [...new Set(symbols)];

    // Fetch all quotes concurrently
    const promises = uniqueSymbols.map(async (symbol) => {
        const quote = await getStockQuote(symbol);
        if (quote) {
            results.set(symbol, quote);
        }
    });

    await Promise.all(promises);
    return results;
}

/**
 * Check if stock data API is available (always true for Yahoo Finance)
 */
export function isFinnhubConfigured(): boolean {
    return true;
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
 * Search for stock symbols using Yahoo Finance autosuggest
 */
export async function searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    if (!query.trim()) {
        return [];
    }

    try {
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&listsCount=0`;
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            console.error(`Yahoo Finance search error: ${response.status}`);
            return [];
        }

        const data = await response.json();

        if (!data.quotes || data.quotes.length === 0) {
            return [];
        }

        return data.quotes
            .filter((q: any) => q.quoteType === "EQUITY" && q.symbol && q.shortname)
            .slice(0, 10)
            .map((q: any) => ({
                symbol: q.symbol,
                description: q.shortname || q.longname || q.symbol,
                type: q.quoteType,
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

/**
 * Fetch historical candle data using Yahoo Finance chart API
 * @param symbol Stock symbol
 * @param range Time range: "1W", "1M", "3M", "6M", "1Y"
 */
export async function getStockCandles(symbol: string, range: string = "1M"): Promise<StockCandle[]> {
    // Map our range values to Yahoo Finance parameters
    let yahooRange: string;
    let interval: string;

    switch (range) {
        case "1W":  yahooRange = "5d";  interval = "1d"; break;
        case "1M":  yahooRange = "1mo"; interval = "1d"; break;
        case "3M":  yahooRange = "3mo"; interval = "1d"; break;
        case "6M":  yahooRange = "6mo"; interval = "1d"; break;
        case "1Y":  yahooRange = "1y";  interval = "1d"; break;
        default:    yahooRange = "1mo"; interval = "1d"; break;
    }

    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${yahooRange}&interval=${interval}`;
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            console.error(`Yahoo Finance chart error for ${symbol}: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];

        if (!result?.timestamp || !result?.indicators?.quote?.[0]) {
            console.warn(`No chart data from Yahoo for ${symbol}`);
            return [];
        }

        const timestamps: number[] = result.timestamp;
        const quote = result.indicators.quote[0];

        return timestamps
            .map((ts: number, i: number) => ({
                date: new Date(ts * 1000).toISOString().split("T")[0],
                open: quote.open?.[i] ?? 0,
                high: quote.high?.[i] ?? 0,
                low: quote.low?.[i] ?? 0,
                close: quote.close?.[i] ?? 0,
                volume: quote.volume?.[i] ?? 0,
            }))
            .filter((c: StockCandle) => c.close > 0);
    } catch (error) {
        console.error(`Failed to fetch chart data for ${symbol}:`, error);
        return [];
    }
}

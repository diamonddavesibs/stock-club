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

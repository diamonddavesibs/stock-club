import { Holding } from './types';

export interface DFDIIHolding {
    symbol: string;
    qty: number;
    price: number;
    date: string;
    costBasis: number;
    dividends: number;
    yieldPercent: number;
    divYTD: number;
    monthsHeld: number;
    lastPrice?: number;
    marketValue?: number;
    gainDollar?: number;
    gainPercent?: number;
    return?: number;
    returnPercent?: number;
    returnPerMonth?: number;
}

const companyNames: Record<string, string> = {
    GGN: "Gabelli Global Equity & Income Trust",
    AMZN: "Amazon.com Inc.",
    GNRC: "Generac Holdings Inc.",
    GNT: "GAMCO Natural Resources, Gold & Income Trust",
    KO: "The Coca-Cola Company",
    ET: "Energy Transfer LP",
    EPD: "Enterprise Products Partners L.P.",
    DNP: "DNP Select Income Fund",
    CVX: "Chevron Corporation",
    NVDA: "NVIDIA Corporation",
    CLM: "Cornerstone Total Return Fund",
    GUT: "Gabelli Utility Trust",
    WMT: "Walmart Inc.",
    SYK: "Stryker Corporation",
    BMY: "Bristol-Myers Squibb Company",
    PHK: "PIMCO High Income Fund",
    AAPL: "Apple Inc.",
    CRF: "Cornerstone Strategic Return Fund",
    BKR: "Baker Hughes Company",
    AUR: "Aurora Innovation Inc.",
    ORCL: "Oracle Corporation",
    HD: "The Home Depot Inc.",
    APLD: "Applied Digital Corporation",
    LGN: "LGN",
    IBM: "International Business Machines Corp.",
    LEN: "Lennar Corporation",
    PLTR: "Palantir Technologies Inc.",
    RKT: "Rocket Companies Inc.",
    HUMA: "Humacyte Inc.",
    BSX: "Boston Scientific Corporation",
};

export const staticHoldings: DFDIIHolding[] = [
    { symbol: "GGN",  qty: 6400, price: 3.18,   date: "2/17/2021",  costBasis: 20382.08, dividends: 10654.00, yieldPercent: 0, divYTD: 0, monthsHeld: 64 },
    { symbol: "AMZN", qty: 175,  price: 141.93,  date: "9/21/2022",  costBasis: 24838.10, dividends: 0.00,     yieldPercent: 0, divYTD: 0, monthsHeld: 45 },
    { symbol: "GNRC", qty: 100,  price: 113.47,  date: "4/16/2025",  costBasis: 11347.00, dividends: 0.00,     yieldPercent: 0, divYTD: 0, monthsHeld: 14 },
    { symbol: "GNT",  qty: 2000, price: 4.13,    date: "3/16/2022",  costBasis: 8250.40,  dividends: 3980.00,  yieldPercent: 0, divYTD: 0, monthsHeld: 51 },
    { symbol: "KO",   qty: 300,  price: 53.56,   date: "2/17/2021",  costBasis: 16069.47, dividends: 3743.00,  yieldPercent: 0, divYTD: 0, monthsHeld: 64 },
    { symbol: "ET",   qty: 1000, price: 12.64,   date: "8/16/2023",  costBasis: 12639.00, dividends: 3575.00,  yieldPercent: 0, divYTD: 0, monthsHeld: 34 },
    { symbol: "EPD",  qty: 400,  price: 23.46,   date: "3/17/2021",  costBasis: 9384.00,  dividends: 4332.00,  yieldPercent: 0, divYTD: 0, monthsHeld: 63 },
    { symbol: "DNP",  qty: 1000, price: 9.62,    date: "5/19/2021",  costBasis: 9616.80,  dividends: 4570.00,  yieldPercent: 0, divYTD: 0, monthsHeld: 61 },
    { symbol: "CVX",  qty: 100,  price: 136.64,  date: "4/16/2025",  costBasis: 13664.00, dividends: 869.00,   yieldPercent: 0, divYTD: 0, monthsHeld: 14 },
    { symbol: "NVDA", qty: 75,   price: 140.20,  date: "10/1/2024",  costBasis: 10515.00, dividends: 3.75,     yieldPercent: 0, divYTD: 0, monthsHeld: 8  },
    { symbol: "CLM",  qty: 2551, price: 6.96,    date: "9/22/2021",  costBasis: 17750.47, dividends: 3047.31,  yieldPercent: 0, divYTD: 0, monthsHeld: 57 },
    { symbol: "GUT",  qty: 1000, price: 5.30,    date: "3/17/2021",  costBasis: 5303.10,  dividends: 3150.00,  yieldPercent: 0, divYTD: 0, monthsHeld: 63 },
    { symbol: "WMT",  qty: 100,  price: 89.78,   date: "3/19/2025",  costBasis: 8978.00,  dividends: 145.75,   yieldPercent: 0, divYTD: 0, monthsHeld: 15 },
    { symbol: "SYK",  qty: 50,   price: 266.86,  date: "8/18/2021",  costBasis: 13342.85, dividends: 738.50,   yieldPercent: 0, divYTD: 0, monthsHeld: 58 },
    { symbol: "BMY",  qty: 200,  price: 50.02,   date: "2/21/2024",  costBasis: 10003.98, dividends: 1352.00,  yieldPercent: 0, divYTD: 0, monthsHeld: 28 },
    { symbol: "PHK",  qty: 2500, price: 5.54,    date: "2/17/2021",  costBasis: 13841.50, dividends: 4882.00,  yieldPercent: 0, divYTD: 0, monthsHeld: 64 },
    { symbol: "AAPL", qty: 60,   price: 259.27,  date: "10/22/2025", costBasis: 15556.20, dividends: 37.00,    yieldPercent: 0, divYTD: 0, monthsHeld: 8  },
    { symbol: "CRF",  qty: 2070, price: 7.88,    date: "11/17/2021", costBasis: 16299.27, dividends: 3677.08,  yieldPercent: 0, divYTD: 0, monthsHeld: 55 },
    { symbol: "BKR",  qty: 100,  price: 53.50,   date: "1/21/2026",  costBasis: 5350.00,  dividends: 46.00,    yieldPercent: 0, divYTD: 0, monthsHeld: 5  },
    { symbol: "AUR",  qty: 750,  price: 5.70,    date: "8/20/2025",  costBasis: 4275.00,  dividends: 0.00,     yieldPercent: 0, divYTD: 0, monthsHeld: 10 },
    { symbol: "ORCL", qty: 100,  price: 185.75,  date: "11/19/2025", costBasis: 18575.00, dividends: 25.00,    yieldPercent: 0, divYTD: 0, monthsHeld: 7  },
    { symbol: "HD",   qty: 50,   price: 339.58,  date: "11/19/2025", costBasis: 16978.93, dividends: 232.25,   yieldPercent: 0, divYTD: 0, monthsHeld: 7  },
    { symbol: "APLD", qty: 100,  price: 45.24,   date: "5/27/2026",  costBasis: 4524.00,  dividends: 0.00,     yieldPercent: 0, divYTD: 0, monthsHeld: 1  },
    { symbol: "LGN",  qty: 100,  price: 88.87,   date: "5/27/2026",  costBasis: 8887.00,  dividends: 0.00,     yieldPercent: 0, divYTD: 0, monthsHeld: 1  },
    { symbol: "IBM",  qty: 30,   price: 290.00,  date: "11/19/2025", costBasis: 8700.00,  dividends: 101.10,   yieldPercent: 0, divYTD: 0, monthsHeld: 7  },
    { symbol: "LEN",  qty: 100,  price: 105.63,  date: "4/16/2025",  costBasis: 10563.00, dividends: 250.00,   yieldPercent: 0, divYTD: 0, monthsHeld: 14 },
    { symbol: "PLTR", qty: 50,   price: 167.65,  date: "11/19/2025", costBasis: 8382.50,  dividends: 0.00,     yieldPercent: 0, divYTD: 0, monthsHeld: 7  },
    { symbol: "RKT",  qty: 250,  price: 21.10,   date: "9/17/2025",  costBasis: 5273.75,  dividends: 0.00,     yieldPercent: 0, divYTD: 0, monthsHeld: 9  },
    { symbol: "HUMA", qty: 2000, price: 2.43,    date: "5/21/2025",  costBasis: 4856.40,  dividends: 0.00,     yieldPercent: 0, divYTD: 0, monthsHeld: 13 },
    { symbol: "BSX",  qty: 150,  price: 70.43,   date: "3/19/2026",  costBasis: 10564.50, dividends: 0.00,     yieldPercent: 0, divYTD: 0, monthsHeld: 3  },
];

export const dfdiiHoldingsAsPortfolio: Holding[] = staticHoldings.map(h => {
    const costPerShare = h.costBasis / h.qty;
    const marketValue = h.qty * h.price;
    const gainLoss = marketValue - h.costBasis;
    return {
        symbol: h.symbol,
        name: companyNames[h.symbol] || h.symbol,
        quantity: h.qty,
        costPerShare,
        currentPrice: h.price,
        marketValue,
        gainLoss,
        gainLossPercent: (gainLoss / h.costBasis) * 100,
    };
});

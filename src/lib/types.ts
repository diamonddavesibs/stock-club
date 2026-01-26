// Types for portfolio data
export interface Holding {
    symbol: string;
    name: string;
    quantity: number;
    costPerShare: number;
    currentPrice: number;
    marketValue: number;
    gainLoss: number;
    gainLossPercent: number;
}

export interface Transaction {
    date: string;
    action: "BUY" | "SELL" | "DIVIDEND" | "DEPOSIT" | "WITHDRAWAL" | "OTHER";
    symbol: string;
    description: string;
    quantity: number;
    price: number;
    fees: number;
    amount: number;
}

export interface PortfolioData {
    holdings: Holding[];
    transactions: Transaction[];
    totalValue: number;
    totalCost: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    cashBalance: number;
    lastUpdated: string;
}

// Default empty portfolio
export const emptyPortfolio: PortfolioData = {
    holdings: [],
    transactions: [],
    totalValue: 0,
    totalCost: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
    cashBalance: 0,
    lastUpdated: new Date().toISOString(),
};

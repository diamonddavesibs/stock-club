import { PortfolioData, emptyPortfolio } from "./types";
import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

/**
 * Save portfolio data to database
 */
export async function savePortfolioData(userId: string, data: PortfolioData): Promise<void> {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Upsert portfolio record
        const portfolio = await tx.portfolio.upsert({
            where: { userId },
            create: {
                userId,
                totalValue: data.totalValue,
                totalCost: data.totalCost,
                totalGainLoss: data.totalGainLoss,
                totalGainLossPercent: data.totalGainLossPercent,
                cashBalance: data.cashBalance,
                lastUpdated: new Date(data.lastUpdated),
            },
            update: {
                totalValue: data.totalValue,
                totalCost: data.totalCost,
                totalGainLoss: data.totalGainLoss,
                totalGainLossPercent: data.totalGainLossPercent,
                cashBalance: data.cashBalance,
                lastUpdated: new Date(data.lastUpdated),
            },
        });

        // Delete existing holdings and create new ones
        await tx.holding.deleteMany({
            where: { portfolioId: portfolio.id },
        });

        if (data.holdings.length > 0) {
            await tx.holding.createMany({
                data: data.holdings.map((h: typeof data.holdings[0]) => ({
                    portfolioId: portfolio.id,
                    symbol: h.symbol,
                    name: h.name,
                    quantity: h.quantity,
                    costPerShare: h.costPerShare,
                    currentPrice: h.currentPrice,
                    marketValue: h.marketValue,
                    gainLoss: h.gainLoss,
                    gainLossPercent: h.gainLossPercent,
                })),
            });
        }

        // Add new transactions (don't delete old ones)
        if (data.transactions.length > 0) {
            // Only add transactions that don't already exist
            const existingCount = await tx.transaction.count({
                where: { portfolioId: portfolio.id },
            });

            if (existingCount < data.transactions.length) {
                const newTransactions = data.transactions.slice(existingCount);
                await tx.transaction.createMany({
                    data: newTransactions.map((t: typeof data.transactions[0]) => ({
                        portfolioId: portfolio.id,
                        date: new Date(t.date),
                        action: t.action,
                        symbol: t.symbol,
                        description: t.description,
                        quantity: t.quantity,
                        price: t.price,
                        fees: t.fees,
                        amount: t.amount,
                    })),
                });
            }
        }
    });
}

/**
 * Load portfolio data from database
 */
export async function loadPortfolioData(userId: string): Promise<PortfolioData> {
    const portfolio = await prisma.portfolio.findUnique({
        where: { userId },
        include: {
            holdings: true,
            transactions: {
                orderBy: { date: 'desc' },
            },
        },
    });

    if (!portfolio) {
        return emptyPortfolio;
    }

    return {
        holdings: portfolio.holdings.map((h: typeof portfolio.holdings[0]) => ({
            symbol: h.symbol,
            name: h.name,
            quantity: h.quantity,
            costPerShare: h.costPerShare,
            currentPrice: h.currentPrice,
            marketValue: h.marketValue,
            gainLoss: h.gainLoss,
            gainLossPercent: h.gainLossPercent,
        })),
        transactions: portfolio.transactions.map((t: typeof portfolio.transactions[0]) => ({
            date: t.date.toISOString(),
            action: t.action as "BUY" | "SELL" | "DIVIDEND" | "DEPOSIT" | "WITHDRAWAL" | "OTHER",
            symbol: t.symbol,
            description: t.description,
            quantity: t.quantity,
            price: t.price,
            fees: t.fees,
            amount: t.amount,
        })),
        totalValue: portfolio.totalValue,
        totalCost: portfolio.totalCost,
        totalGainLoss: portfolio.totalGainLoss,
        totalGainLossPercent: portfolio.totalGainLossPercent,
        cashBalance: portfolio.cashBalance,
        lastUpdated: portfolio.lastUpdated.toISOString(),
    };
}

/**
 * Clear stored portfolio data
 */
export async function clearPortfolioData(userId: string): Promise<void> {
    await prisma.portfolio.delete({
        where: { userId },
    });
}

/**
 * Check if user has portfolio data
 */
export async function hasPortfolioData(userId: string): Promise<boolean> {
    const count = await prisma.portfolio.count({
        where: { userId },
    });
    return count > 0;
}

/**
 * MIGRATION UTILITY: Import localStorage data to database
 * Call this once per user to migrate existing localStorage data
 */
export async function migrateLocalStorageToDatabase(userId: string): Promise<void> {
    if (typeof window === "undefined") return;

    const STORAGE_KEY = "dfdii_portfolio_data";
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return;

    try {
        const data = JSON.parse(stored) as PortfolioData;
        await savePortfolioData(userId, data);

        // Optionally clear localStorage after successful migration
        localStorage.removeItem(STORAGE_KEY);
        console.log("Portfolio data migrated successfully");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

import { PortfolioData, emptyPortfolio } from "./types";

const STORAGE_KEY = "dfdii_portfolio_data";

/**
 * Save portfolio data to localStorage
 */
export function savePortfolioData(data: PortfolioData): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Load portfolio data from localStorage
 */
export function loadPortfolioData(): PortfolioData {
    if (typeof window === "undefined") return emptyPortfolio;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyPortfolio;

    try {
        return JSON.parse(stored) as PortfolioData;
    } catch {
        return emptyPortfolio;
    }
}

/**
 * Clear stored portfolio data
 */
export function clearPortfolioData(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if there's stored portfolio data
 */
export function hasPortfolioData(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) !== null;
}

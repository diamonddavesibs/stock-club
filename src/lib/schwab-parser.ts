import { Holding, Transaction, PortfolioData, emptyPortfolio } from "./types";

/**
 * Parse Schwab Positions CSV export
 * Expected columns: Symbol, Description, Quantity, Price, Market Value, Cost Basis, Gain/Loss, Gain/Loss %
 * Note: Schwab format may vary slightly - this parser is flexible
 */
export function parseSchwabPositionsCSV(csvContent: string): Holding[] {
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) return [];

    // Find header row (Schwab sometimes has metadata rows at the top)
    let headerIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes("symbol") && (line.includes("quantity") || line.includes("shares"))) {
            headerIndex = i;
            break;
        }
    }

    const headers = parseCSVLine(lines[headerIndex]).map((h) => h.toLowerCase().trim());
    const holdings: Holding[] = [];

    // Map common Schwab column names
    const symbolCol = findColumn(headers, ["symbol", "ticker"]);
    const nameCol = findColumn(headers, ["description", "name", "security"]);
    const quantityCol = findColumn(headers, ["quantity", "shares", "qty"]);
    const priceCol = findColumn(headers, ["price", "current price", "last price", "market price"]);
    const marketValueCol = findColumn(headers, ["market value", "value", "total value"]);
    const costBasisCol = findColumn(headers, ["cost basis", "cost", "total cost", "book cost"]);
    const costPerShareCol = findColumn(headers, ["cost/share", "avg cost", "average cost", "cost per share"]);
    const gainLossCol = findColumn(headers, ["gain/loss", "gain loss", "unrealized gain", "unrealized gain/loss"]);
    const gainLossPctCol = findColumn(headers, ["gain/loss %", "gain loss %", "% gain/loss", "unrealized gain %"]);

    for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith("\"\"") || line.toLowerCase().includes("total")) continue;

        const values = parseCSVLine(line);
        const symbol = getValue(values, symbolCol);

        // Skip empty rows or cash entries
        if (!symbol || symbol === "" || symbol.toLowerCase() === "cash" || symbol === "--") continue;

        const quantity = parseNumber(getValue(values, quantityCol));
        const currentPrice = parseNumber(getValue(values, priceCol));
        const marketValue = parseNumber(getValue(values, marketValueCol)) || quantity * currentPrice;
        const costBasis = parseNumber(getValue(values, costBasisCol));
        const costPerShare = parseNumber(getValue(values, costPerShareCol)) || (costBasis / quantity) || 0;
        const gainLoss = parseNumber(getValue(values, gainLossCol)) || (marketValue - costBasis);
        const gainLossPercent = parseNumber(getValue(values, gainLossPctCol)) || (costBasis > 0 ? ((marketValue - costBasis) / costBasis) * 100 : 0);

        if (quantity > 0) {
            holdings.push({
                symbol: symbol.toUpperCase(),
                name: getValue(values, nameCol) || symbol,
                quantity,
                costPerShare,
                currentPrice,
                marketValue,
                gainLoss,
                gainLossPercent,
            });
        }
    }

    return holdings;
}

/**
 * Parse Schwab Transaction History JSON export
 * Schwab JSON format has: FromDate, ToDate, TotalTransactionsAmount, BrokerageTransactions[]
 */
export function parseSchwabTransactionsJSON(jsonContent: string): Transaction[] {
    try {
        const data = JSON.parse(jsonContent);
        const transactions: Transaction[] = [];

        // Handle the BrokerageTransactions array
        const rawTransactions = data.BrokerageTransactions || data.transactions || [];

        for (const tx of rawTransactions) {
            const actionRaw = (tx.Action || "").toLowerCase();

            // Map Schwab actions to our types
            let action: Transaction["action"] = "OTHER";
            if (actionRaw.includes("buy")) action = "BUY";
            else if (actionRaw.includes("sell")) action = "SELL";
            else if (actionRaw.includes("dividend") || actionRaw.includes("div")) action = "DIVIDEND";
            else if (actionRaw.includes("deposit") || actionRaw.includes("transfer in")) action = "DEPOSIT";
            else if (actionRaw.includes("withdraw") || actionRaw.includes("transfer out")) action = "WITHDRAWAL";
            else if (actionRaw.includes("reinvest")) action = "DIVIDEND";

            transactions.push({
                date: parseSchwabDate(tx.Date || ""),
                action,
                symbol: (tx.Symbol || "--").toUpperCase(),
                description: tx.Description || "",
                quantity: Math.abs(parseNumber(tx.Quantity || "0")),
                price: parseNumber(tx.Price || "0"),
                fees: parseNumber(tx["Fees & Comm"] || tx.Fees || "0"),
                amount: parseNumber(tx.Amount || "0"),
            });
        }

        return transactions;
    } catch (error) {
        console.error("Failed to parse Schwab JSON:", error);
        return [];
    }
}

/**
 * Parse Schwab Transaction History CSV export
 * Expected columns: Date, Action, Symbol, Description, Quantity, Price, Fees & Comm, Amount
 */
export function parseSchwabTransactionsCSV(csvContent: string): Transaction[] {
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) return [];

    // Find header row
    let headerIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes("date") && line.includes("action")) {
            headerIndex = i;
            break;
        }
    }

    const headers = parseCSVLine(lines[headerIndex]).map((h) => h.toLowerCase().trim());
    const transactions: Transaction[] = [];

    const dateCol = findColumn(headers, ["date", "trade date"]);
    const actionCol = findColumn(headers, ["action", "type", "transaction type"]);
    const symbolCol = findColumn(headers, ["symbol", "ticker"]);
    const descCol = findColumn(headers, ["description", "name", "security"]);
    const quantityCol = findColumn(headers, ["quantity", "shares", "qty"]);
    const priceCol = findColumn(headers, ["price"]);
    const feesCol = findColumn(headers, ["fees & comm", "fees", "commission", "fees & commission"]);
    const amountCol = findColumn(headers, ["amount", "total", "net amount"]);

    for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith("\"\"")) continue;

        const values = parseCSVLine(line);
        const date = getValue(values, dateCol);
        const actionRaw = getValue(values, actionCol).toLowerCase();

        if (!date) continue;

        // Map Schwab actions to our types
        let action: Transaction["action"] = "OTHER";
        if (actionRaw.includes("buy")) action = "BUY";
        else if (actionRaw.includes("sell")) action = "SELL";
        else if (actionRaw.includes("dividend") || actionRaw.includes("div")) action = "DIVIDEND";
        else if (actionRaw.includes("deposit") || actionRaw.includes("transfer in")) action = "DEPOSIT";
        else if (actionRaw.includes("withdraw") || actionRaw.includes("transfer out")) action = "WITHDRAWAL";

        transactions.push({
            date: parseSchwabDate(date),
            action,
            symbol: getValue(values, symbolCol).toUpperCase() || "--",
            description: getValue(values, descCol),
            quantity: Math.abs(parseNumber(getValue(values, quantityCol))),
            price: parseNumber(getValue(values, priceCol)),
            fees: parseNumber(getValue(values, feesCol)),
            amount: parseNumber(getValue(values, amountCol)),
        });
    }

    return transactions;
}

/**
 * Calculate portfolio totals from holdings
 */
export function calculatePortfolioTotals(holdings: Holding[], transactions: Transaction[]): PortfolioData {
    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalCost = holdings.reduce((sum, h) => sum + (h.costPerShare * h.quantity), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    // Estimate cash from recent deposits/withdrawals (simplified)
    const cashBalance = 0; // Would need separate cash position data

    return {
        holdings,
        transactions,
        totalValue,
        totalCost,
        totalGainLoss,
        totalGainLossPercent,
        cashBalance,
        lastUpdated: new Date().toISOString(),
    };
}

// Helper functions
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function findColumn(headers: string[], possibleNames: string[]): number {
    for (const name of possibleNames) {
        const index = headers.findIndex((h) => h.includes(name));
        if (index !== -1) return index;
    }
    return -1;
}

function getValue(values: string[], index: number): string {
    if (index < 0 || index >= values.length) return "";
    return values[index].replace(/^"|"$/g, "").trim();
}

function parseNumber(value: string): number {
    if (!value) return 0;
    // Remove currency symbols, commas, parentheses (for negative)
    const cleaned = value.replace(/[$,\s]/g, "").replace(/^\((.+)\)$/, "-$1");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

/**
 * Parse Schwab date format (MM/DD/YYYY) to ISO format (YYYY-MM-DD)
 * Schwab exports dates as "01/26/2026" which JavaScript doesn't parse reliably
 */
function parseSchwabDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();

    // Handle MM/DD/YYYY format
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
        const [, month, day, year] = slashMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Handle YYYY-MM-DD format (already ISO)
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return dateStr;
    }

    // Try to parse as-is and convert to ISO
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
    }

    // Fallback to current date
    return new Date().toISOString().split('T')[0];
}

/**
 * Auto-detect file format and parse transactions
 * Accepts either JSON or CSV content
 */
export function parseSchwabTransactions(content: string, filename?: string): Transaction[] {
    const trimmed = content.trim();

    // Check if it's JSON (starts with { or [)
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        return parseSchwabTransactionsJSON(content);
    }

    // Check by filename extension
    if (filename?.toLowerCase().endsWith(".json")) {
        return parseSchwabTransactionsJSON(content);
    }

    // Default to CSV
    return parseSchwabTransactionsCSV(content);
}

/**
 * Auto-detect file format and parse positions
 * Currently only CSV is supported for positions
 */
export function parseSchwabPositions(content: string, _filename?: string): Holding[] {
    // Positions are always CSV from Schwab
    return parseSchwabPositionsCSV(content);
}

export { emptyPortfolio };

/**
 * Currency formatting utilities for Aporte.
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
    BRL: "R$",
    USD: "$",
    EUR: "€",
};

/**
 * Formats a number as currency based on the provided currency code.
 */
export function formatCurrency(value: number, currency: string = "BRL"): string {
    const symbol = CURRENCY_SYMBOLS[currency] || "R$";
    const formatted = value.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${symbol} ${formatted}`;
}

/**
 * Formats a large number with K/M suffixes.
 */
export function formatCompactNumber(value: number, currency: string = "BRL"): string {
    const symbol = CURRENCY_SYMBOLS[currency] || "R$";
    if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}k`;
    return `${symbol}${value.toFixed(0)}`;
}

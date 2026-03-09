/**
 * Core types for the Aporte project.
 * Internal documentation is in EN-US.
 */

export interface User {
    id: string;
    email?: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserSettings {
    id: string;
    userId: string;
    defaultCurrency: string;
    contributionFrequency: string;
    defaultContribution: number;
    dripEnabled: boolean;
    b3Strict: boolean;
    discountInflation: boolean;
    defaultBenchmark: string;
    updatedAt: Date;
}

export interface Portfolio {
    id: string;
    userId: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    assets: Asset[];
}

export interface Asset {
    id: string;
    portfolioId: string;
    ticker: string;
    targetWeight: number;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Backtest {
    id: string;
    userId: string;
    name: string;
    startDate: string;
    endDate: string;
    cagr: number;
    maxDrawdown: number;
    sharpeRatio?: number;
    totalValue: number;
    totalInvested: number;
    portfolioId?: string;
    initialCapital?: number;
    monthlyContribution?: number;
    createdAt: Date;
}

export interface AvailableAsset {
    id: string;
    ticker: string;
    name: string;
    updatedAt: Date;
}

export interface SimulationResult {
    total_value: number;
    total_return: number;
    cagr: number;
    max_drawdown: number;
    sharpe_ratio: number;
    total_contributed: number;
    total_dividends: number;
    history: SimulationSnapshot[];
    benchmark_history?: SimulationSnapshot[];
    operations_log: SimulationOperation[];
    monthly_returns: SimulationMonthlyReturn[];
}

export interface SimulationSnapshot {
    date: string;
    value: number;
    cash: number;
    contributed: number;
    dividends: number;
    allocations: Record<string, number>;
}

export interface SimulationOperation {
    date: string;
    action: 'BUY' | 'SELL';
    ticker: string;
    shares: number;
    price: number;
    total_cost: number;
    reason: string;
}

export interface SimulationMonthlyReturn {
    date: string;
    return: number;
}

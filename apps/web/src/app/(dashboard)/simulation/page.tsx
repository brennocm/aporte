"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getPortfolios } from "@/app/actions/portfolio";
import { getUserSettings } from "@/app/actions/settings";
import { saveBacktestResult } from "@/app/actions/backtest";

import { Toast } from "@/components/Toast";
import { formatCurrency } from "@/lib/format";
import { Download, Info } from "lucide-react";
import { ReturnsHeatmap } from "@/components/ReturnsHeatmap";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import { Asset, Portfolio, SimulationResult, SimulationSnapshot } from "@aporte/shared";

export default function SimulationPage() {
    const searchParams = useSearchParams();
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("");
    const [initialCapital, setInitialCapital] = useState(0);
    const [monthlyContribution, setMonthlyContribution] = useState(1000);
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear() - 1, 0, 1).toISOString().slice(0, 10)); // YYYY-MM-DD (1 year ago)
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const [dripEnabled, setDripEnabled] = useState(true);
    const [b3Strict, setB3Strict] = useState(true);
    const [inflationAdjusted, setInflationAdjusted] = useState(false);
    const [contributionFrequency, setContributionFrequency] = useState("monthly");
    const [currency, setCurrency] = useState("BRL");
    const [defaultBenchmark, setDefaultBenchmark] = useState("IBOV");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [pData, sData] = await Promise.all([
                    getPortfolios(),
                    getUserSettings()
                ]);
                setPortfolios(pData);
                if (pData.length > 0) setSelectedPortfolioId(pData[0].id);

                if (sData) {
                    setMonthlyContribution(sData.defaultContribution || 1000);
                    setContributionFrequency(sData.contributionFrequency || "monthly");
                    setDripEnabled(sData.dripEnabled);
                    setB3Strict(sData.b3Strict);
                    setInflationAdjusted(sData.discountInflation);
                    setCurrency(sData.defaultCurrency || "BRL");
                    setDefaultBenchmark(sData.defaultBenchmark || "IBOV");
                }

                // Override with URL search params from backtest rerun
                const paramPortfolioId = searchParams.get("portfolioId");
                const paramInitialCapital = searchParams.get("initialCapital");
                const paramMonthlyContribution = searchParams.get("monthlyContribution");
                const paramStartDate = searchParams.get("startDate");
                const paramEndDate = searchParams.get("endDate");

                if (paramPortfolioId && pData.some(p => p.id === paramPortfolioId)) {
                    setSelectedPortfolioId(paramPortfolioId);
                }
                if (paramInitialCapital != null) {
                    setInitialCapital(Number(paramInitialCapital));
                }
                if (paramMonthlyContribution != null) {
                    setMonthlyContribution(Number(paramMonthlyContribution));
                }
                if (paramStartDate) {
                    setStartDate(paramStartDate);
                }
                if (paramEndDate) {
                    setEndDate(paramEndDate);
                }
            } catch (err) {
                console.error("Error loading simulation data:", err);
                setToast({ message: "Falha ao carregar carteiras ou configurações.", type: "error" });
            }
        }
        loadData();
    }, [searchParams]);

    const handleRunSimulation = async (overrideBenchmark?: string) => {
        if (!selectedPortfolioId) return;

        setLoading(true);
        setToast(null);

        try {
            const portfolio = portfolios.find((p: Portfolio) => p.id === selectedPortfolioId);
            if (!portfolio) throw new Error("Carteira não encontrada");

            // Validation: Ensure all assets have a valid ticker (not empty or too short)
            const invalidAssets = portfolio.assets.filter((a: Asset) => !a.ticker || a.ticker.length < 2);
            if (invalidAssets.length > 0) {
                throw new Error(`Ativo(s) inválido(s) ou incompleto(s): ${invalidAssets.map((a: Asset) => a.ticker || "Vazio").join(", ")}`);
            }

            const res = await fetch("/api/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    portfolio_id: selectedPortfolioId,
                    assets: portfolio.assets.map((a: Asset) => ({
                        ticker: a.ticker,
                        target_weight: a.targetWeight
                    })),
                    initial_capital: initialCapital,
                    monthly_contribution: monthlyContribution,
                    contribution_frequency: contributionFrequency,
                    start_date: startDate,
                    end_date: endDate,
                    drip_enabled: dripEnabled,
                    b3_strict: b3Strict,
                    inflation_adjusted: inflationAdjusted,
                    benchmark: overrideBenchmark || defaultBenchmark
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Erro no motor de simulação");
            }

            setResult(data);
            setToast({ message: "Simulação concluída com sucesso!", type: "success" });

            // Save to history
            saveBacktestResult({
                name: `${portfolio.name} ${startDate} → ${endDate}`,
                startDate: startDate,
                endDate: endDate,
                cagr: data.cagr,
                maxDrawdown: data.max_drawdown,
                totalValue: data.total_value,
                totalInvested: data.total_contributed,
                portfolioId: selectedPortfolioId,
                initialCapital: initialCapital,
                monthlyContribution: monthlyContribution
            }).catch(e => console.error("Error saving backtest:", e));

        } catch (err) {
            setToast({
                message: err instanceof Error ? err.message : "Ocorreu um erro inesperado ao rodar a simulação.",
                type: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!result) return;

        const headers = ["Data", "Patrimônio", "Investido", "Dividendos Recebidos"];
        const rows = result.history.map((h: SimulationSnapshot) => [
            h.date,
            h.value.toFixed(2),
            h.contributed.toFixed(2),
            (h.dividends || 0).toFixed(2)
        ]);

        const csvContent = "\uFEFF" + headers.join(",") + "\n"
            + rows.map((e: string[]) => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `backtest_${selectedPortfolioId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const chartData = result?.history?.map((h: SimulationSnapshot, index: number) => ({
        month: new Date(h.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        Patrimônio: h.value,
        Investido: h.contributed,
        Benchmark: result.benchmark_history ? result.benchmark_history[index]?.value : null
    })) || [];

    return (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] w-full font-sans tracking-tight">
            {/* Settings Column */}
            <aside className="w-full lg:w-96 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex-shrink-0 p-6 overflow-y-auto overflow-x-hidden z-10">
                <div className="flex items-center gap-2 mb-8">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Parâmetros</h2>
                </div>

                <div className="space-y-6">
                    {toast && (
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={() => setToast(null)}
                        />
                    )}

                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Ativos</h3>
                        <div>
                            <select
                                value={selectedPortfolioId}
                                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-black dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                            >
                                {portfolios.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Capital</h3>
                        <div className="relative">
                            <label className="absolute left-4 top-1.5 text-[10px] font-medium text-slate-500 uppercase">Valor Inicial</label>
                            <input
                                type="number"
                                value={initialCapital}
                                onChange={(e) => setInitialCapital(Number(e.target.value))}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 pt-6 pb-2 text-sm font-semibold text-black dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                            <div className="absolute right-4 top-6 text-xs text-slate-400 font-bold">{currency}</div>
                        </div>

                        <div className="relative">
                            <label className="absolute left-4 top-1.5 text-[10px] font-medium text-slate-500 uppercase">
                                {contributionFrequency === 'weekly' ? 'Aporte Semanal' :
                                    contributionFrequency === 'biweekly' ? 'Aporte Quinzenal' :
                                        'Aporte Mensal'}
                            </label>
                            <input
                                type="number"
                                value={monthlyContribution}
                                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 pt-6 pb-2 text-sm font-semibold text-black dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                            <div className="absolute right-4 top-6 text-xs text-slate-400 font-bold">{currency}</div>
                        </div>

                        <div className="relative">
                            <label className="absolute left-4 top-1.5 text-[10px] font-medium text-slate-500 uppercase">Frequência</label>
                            <select
                                value={contributionFrequency}
                                onChange={(e) => setContributionFrequency(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 pt-6 pb-2 text-xs font-semibold text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            >
                                <option value="monthly">Mensal</option>
                                <option value="biweekly">Quinzenal</option>
                                <option value="weekly">Semanal</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Período</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <label className="absolute left-4 top-1.5 text-[10px] font-medium text-slate-500 uppercase">Início</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 pt-6 pb-2 text-xs font-semibold text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>
                            <div className="relative">
                                <label className="absolute left-4 top-1.5 text-[10px] font-medium text-slate-500 uppercase">Fim</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 pt-6 pb-2 text-xs font-semibold text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                Reinvestir (DRIP)
                                <span title="Reinveste dividendos automaticamente no mesmo ativo">
                                    <Info className="w-3 h-3 text-slate-400 cursor-help" />
                                </span>
                            </span>
                            <div
                                onClick={() => setDripEnabled(!dripEnabled)}
                                className={`w-9 h-5 ${dripEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'} rounded-full relative cursor-pointer transition-colors`}
                            >
                                <div className={`absolute ${dripEnabled ? 'right-1' : 'left-1'} top-1 w-3 h-3 bg-white rounded-full transition-all`}></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                Restringir à B3
                                <span title="Permite apenas compra de lotes inteiros (sem frações)">
                                    <Info className="w-3 h-3 text-slate-400 cursor-help" />
                                </span>
                            </span>
                            <div
                                onClick={() => setB3Strict(!b3Strict)}
                                className={`w-9 h-5 ${b3Strict ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'} rounded-full relative cursor-pointer transition-colors`}
                            >
                                <div className={`absolute ${b3Strict ? 'right-1' : 'left-1'} top-1 w-3 h-3 bg-white rounded-full transition-all`}></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                Inflação (IPCA)
                                <span title="Desconta o IPCA acumulado do valor final para ganho real">
                                    <Info className="w-3 h-3 text-slate-400 cursor-help" />
                                </span>
                            </span>
                            <div
                                onClick={() => setInflationAdjusted(!inflationAdjusted)}
                                className={`w-9 h-5 ${inflationAdjusted ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'} rounded-full relative cursor-pointer transition-colors`}
                            >
                                <div className={`absolute ${inflationAdjusted ? 'right-1' : 'left-1'} top-1 w-3 h-3 bg-white rounded-full transition-all`}></div>
                            </div>
                        </div>
                    </div>

                    {!result && (
                        <button
                            onClick={() => handleRunSimulation()}
                            disabled={loading || !selectedPortfolioId}
                            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold text-sm tracking-wide transition-all mt-4 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/10 dark:shadow-white/5 disabled:opacity-50"
                        >
                            {loading ? "CALCULANDO..." : "CALCULAR"}
                        </button>
                    )}

                    {toast?.type === 'error' && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <span className="material-icons text-red-500 text-lg mt-0.5">error_outline</span>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Erro de Simulação</p>
                                <p className="text-sm text-red-800 dark:text-red-400 font-medium leading-relaxed">
                                    {toast.message}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-slate-50 dark:bg-[#020617]">
                <div className="max-w-4xl mx-auto">
                    {!result && (
                        <div className="h-full flex flex-col items-center justify-center opacity-40 mt-20 text-center">
                            <div className="w-12 h-12 rounded-full border-2 border-slate-300 dark:border-slate-800 border-t-primary animate-spin mb-4" />
                            <h2 className="text-xl font-bold">Simulador de investimentos</h2>
                            <p className="max-w-xs text-sm mt-2">Veja como um portfólio teria performado, mas lembre-se que performance passada não garante performance futura.</p>
                        </div>
                    )}

                    {result && (
                        <>
                            {/* Header Result */}
                            <div className="text-center mb-12">
                                <h1 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2">Patrimônio Projetado</h1>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        {formatCurrency(result.total_value, currency)}
                                    </span>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${result.total_return >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {result.total_return >= 0 ? '+' : ''}{formatCurrency(result.total_value - result.total_contributed, currency)}
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${result.total_return >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                            {result.total_return >= 0 ? '+' : ''}{result.total_return}%
                                        </div>
                                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                            vs. período total
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="mb-12 relative group h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={result.total_return >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.15} />
                                                <stop offset="95%" stopColor={result.total_return >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" dark-stroke="#1E293B" opacity={0.5} />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            stroke="#94A3B8"
                                            fontSize={10}
                                            tickMargin={15}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                borderRadius: '12px',
                                                border: 'none',
                                                backdropFilter: 'blur(12px)',
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                                padding: '12px'
                                            }}
                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                            labelStyle={{ color: '#94A3B8', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}
                                            formatter={(value: string | number | undefined, name: string | number | undefined) => [formatCurrency(Number(value) || 0, currency), String(name)]}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="Patrimônio"
                                            stroke={result.total_return >= 0 ? "#10B981" : "#EF4444"}
                                            strokeWidth={4}
                                            dot={false}
                                            activeDot={{ r: 6, strokeWidth: 0, fill: "#fff" }}
                                            fill="url(#colorValue)"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="Investido"
                                            stroke="#94A3B8"
                                            strokeWidth={1}
                                            strokeDasharray="4 4"
                                            dot={false}
                                            opacity={0.3}
                                        />
                                        {chartData.some((d: { Benchmark: number | null }) => d.Benchmark != null) && (
                                            <Line
                                                type="monotone"
                                                dataKey="Benchmark"
                                                stroke="#F59E0B"
                                                strokeWidth={2}
                                                strokeDasharray="6 3"
                                                dot={false}
                                                opacity={0.7}
                                            />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Detailed Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                <section>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">Métricas de Risco</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center group py-1">
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Master CAGR</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{result.cagr}%</span>
                                        </div>
                                        <div className="flex justify-between items-center group py-1">
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Max Drawdown</span>
                                            <span className="text-sm font-bold text-red-500">-{result.max_drawdown}%</span>
                                        </div>
                                        <div className="flex justify-between items-center group py-1">
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Sharpe Ratio</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{result.sharpe_ratio}</span>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">Ganho detalhado</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                L&P não realizado
                                                <div className="w-1 h-1 rounded-full bg-primary/40"></div>
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${result.total_return >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    +{formatCurrency(result.total_value - result.total_contributed, currency)}
                                                </span>
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${result.total_return >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {result.total_return}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Dividendos</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
                                                {formatCurrency(result.total_dividends, currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Ganho total</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-black ${result.total_return >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                    {result.total_return >= 0 ? '+' : ''}{formatCurrency(result.total_value - result.total_contributed, currency)}
                                                </span>
                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${result.total_return >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                                                    {result.total_return}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Alocação Final e Heatmap */}
                            <div className="space-y-12 mb-12">
                                <section>
                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">Benchmark</h3>
                                    <div className="relative">
                                        <select
                                            disabled={loading}
                                            value={defaultBenchmark}
                                            onChange={(e) => {
                                                const newBench = e.target.value;
                                                setDefaultBenchmark(newBench);
                                                handleRunSimulation(newBench);
                                            }}
                                            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-black dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                                        >
                                            <option value="IBOV">IBOV (Brasil)</option>
                                            <option value="S&P 500">S&P 500 (EUA)</option>
                                            <option value="CDI">CDI (Renda Fixa)</option>
                                            <option value="IPCA + 6%">IPCA + 6% (Real)</option>
                                        </select>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">Mapa de Calor (Retornos Mensais)</h3>
                                    <ReturnsHeatmap data={result.monthly_returns} />
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <section>
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">Alocação Final</h3>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={Object.entries(result.history[result.history.length - 1].allocations).map(([name, value]) => ({ name, value }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {Object.entries(result.history[result.history.length - 1].allocations).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#6366F1', '#EC4899', '#94A3B8'][index % 6]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">Log de Rebalanceamento</h3>
                                        <div className="max-h-[250px] overflow-y-auto pr-2 space-y-3">
                                            {result.operations_log.slice(-10).reverse().map((op: { ticker: string; action: string; shares: number; price: number; date: string }, i: number) => (
                                                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[10px]">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 dark:text-white underline decoration-primary/30">COMPRA {op.ticker}</span>
                                                        <span className="text-slate-400">{op.date}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-emerald-500">+{op.shares.toFixed(2)} unidades</div>
                                                        <div className="text-slate-400">{formatCurrency(op.shares * op.price, currency)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>

                            {/* Additional Tools */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-primary transition-all shadow-sm"
                                >
                                    <Download className="w-3 h-3" />
                                    Exportar
                                </button>
                                <button
                                    onClick={() => setResult(null)}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg"
                                >
                                    Nova Simulação
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main >
        </div >
    );
}

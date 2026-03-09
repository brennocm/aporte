"use client";

import { Card } from "@aporte/ui";
import React, { useState, useEffect } from "react";
import { getBacktestHistory, deleteBacktest } from "@/app/actions/backtest";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/Toast";
import { Backtest } from "@aporte/shared";

export default function BacktestsPage() {
    const router = useRouter();
    const [backtests, setBacktests] = useState<Backtest[]>([]);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        async function load() {
            const data = await getBacktestHistory();
            setBacktests(data);
            setLoading(false);
        }
        load();
    }, []);

    const filtered = backtests.filter((bt: Backtest) =>
        bt.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        try {
            await deleteBacktest(id);
            setBacktests(backtests.filter(bt => bt.id !== id));
            setToast({ message: "Backtest excluído com sucesso.", type: "success" });
            setDeleteId(null);
        } catch (error) {
            console.error(error);
            setToast({ message: "Erro ao excluir backtest.", type: "error" });
        }
    };

    const handleRerun = (bt: Backtest) => {
        const params = new URLSearchParams();
        if (bt.portfolioId) params.set("portfolioId", bt.portfolioId);
        if (bt.initialCapital != null) params.set("initialCapital", bt.initialCapital.toString());
        if (bt.monthlyContribution != null) params.set("monthlyContribution", bt.monthlyContribution.toString());
        params.set("startDate", bt.startDate);
        params.set("endDate", bt.endDate);
        router.push(`/simulation?${params.toString()}`);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Histórico de Backtests</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Todas as suas simulações passadas.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                    <input
                        type="text"
                        placeholder="Buscar simulação..."
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    />
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Nome da Simulação</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Período</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">CAGR</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Max Drawdown</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Data</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        Carregando histórico...
                                    </td>
                                </tr>
                            ) : filtered.map((bt: Backtest) => (
                                <tr key={bt.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-900 dark:text-white">{bt.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                        {bt.startDate} – {bt.endDate}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-semibold ${(bt.cagr || 0) >= 0 ? "text-success-emerald" : "text-danger-red"}`}>
                                            {(bt.cagr || 0).toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-danger-red font-semibold">
                                        {(bt.maxDrawdown || 0).toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-500 dark:text-slate-400">
                                        {new Date(bt.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {deleteId === bt.id ? (
                                                <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-1 duration-200">
                                                    <button
                                                        onClick={() => handleDelete(bt.id)}
                                                        className="bg-danger-red text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-red-600 transition-colors"
                                                    >
                                                        EXCLUIR
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(null)}
                                                        className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded hover:bg-slate-200"
                                                    >
                                                        X
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleRerun(bt)}
                                                        className="text-slate-400 hover:text-primary transition-colors p-1"
                                                        title="Repetir Simulação"
                                                    >
                                                        <span className="material-icons text-lg">replay</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(bt.id)}
                                                        className="text-slate-400 hover:text-danger-red transition-colors p-1"
                                                        title="Excluir"
                                                    >
                                                        <span className="material-icons text-lg">delete_outline</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <span className="material-icons text-4xl mb-2 block">search_off</span>
                                        Nenhuma simulação encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@aporte/ui";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPortfolios, createPortfolio, deletePortfolio } from "@/app/actions/portfolio";
import { Portfolio, Asset } from "@aporte/shared";

export default function PortfoliosPage() {
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function load() {
            const data = await getPortfolios();
            setPortfolios(data as Portfolio[]);
            setLoading(false);
        }
        load();
    }, []);

    const handleCreate = async () => {
        const newPortfolio = await createPortfolio({ name: "Nova Carteira", description: "" });
        router.push(`/portfolios/${newPortfolio.id}`);
    };

    const handleDelete = async (id: string) => {
        await deletePortfolio(id);
        setPortfolios(portfolios.filter(p => p.id !== id));
        setDeleteId(null);
    };

    if (loading) {
        return <div className="p-8 text-center opacity-50">Carregando carteiras...</div>;
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Meus Portfólios</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie suas carteiras alvo para simulação.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
                >
                    <span className="material-icons text-sm">add</span> Novo Portfólio
                </button>
            </div>

            {portfolios.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-slate-500">Nenhuma carteira encontrada.</p>
                    <Link href="/simulation" className="text-primary hover:underline mt-2 inline-block">
                        Ir para Simulação para criar uma padrão
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolios.map((p: Portfolio) => (
                    <Link href={`/portfolios/${p.id}`} key={p.id} className="block group">
                        <Card className="p-6 h-full hover:border-primary/50 transition-colors flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                        {p.name}
                                    </h3>
                                    <span className="text-sm font-semibold text-success-emerald">
                                        Ativo
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{p.description || "Sem descrição"}</p>
                            </div>

                            <div>
                                <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Composição</div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {p.assets.map((a: Asset) => (
                                        <span key={a.id} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                            {a.ticker} ({a.targetWeight * 100}%)
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 mt-4 w-full">
                                    {deleteId === p.id ? (
                                        <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-right-2 duration-200">
                                            <button
                                                onClick={(e: React.MouseEvent) => { e.preventDefault(); handleDelete(p.id); }}
                                                className="flex-1 bg-danger-red text-white text-[10px] font-bold py-1.5 rounded hover:bg-red-600 transition-colors"
                                            >
                                                CONFIRMAR EXCLUSÃO
                                            </button>
                                            <button
                                                onClick={(e: React.MouseEvent) => { e.preventDefault(); setDeleteId(null); }}
                                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded hover:bg-slate-200"
                                            >
                                                CANCELAR
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-sm font-medium text-primary">
                                                Editar Carteira →
                                            </div>
                                            <button
                                                onClick={(e: React.MouseEvent) => { e.preventDefault(); setDeleteId(p.id); }}
                                                className="text-slate-400 hover:text-danger-red dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                                title="Excluir Carteira"
                                            >
                                                <span className="material-icons text-sm">delete</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}

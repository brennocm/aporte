"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@aporte/ui";
import Link from "next/link";
import { getPortfolioWithAssets, updatePortfolio, savePortfolioAssets } from "@/app/actions/portfolio";
import { AssetAutocomplete } from "@/components/AssetAutocomplete";
import { Toast } from "@/components/Toast";

export default function PortfolioEditPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: portfolioId } = use(params);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [assets, setAssets] = useState<{ ticker: string; targetWeight: number }[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        async function load() {
            if (!portfolioId) return;
            const data = await getPortfolioWithAssets(portfolioId);
            if (data) {
                setName(data.name);
                setDescription(data.description || "");
                setAssets(data.assets.map((a: { ticker: string; targetWeight: number }) => ({
                    ticker: a.ticker,
                    targetWeight: Number((a.targetWeight * 100).toFixed(2))
                })));
            }
            setLoading(false);
        }
        load();
    }, [portfolioId]);

    const handleAddAsset = () => {
        setAssets([...assets, { ticker: "", targetWeight: 0 }]);
    };

    const handleRemoveAsset = (index: number) => {
        setAssets(assets.filter((_, i) => i !== index));
    };

    const handleAssetChange = (index: number, field: "ticker" | "targetWeight", value: string) => {
        const newAssets = [...assets];
        if (field === "ticker") newAssets[index].ticker = value.toUpperCase().replace(/\s/g, "");
        if (field === "targetWeight") newAssets[index].targetWeight = Number(value);
        setAssets(newAssets);
    };

    const totalWeight = Number(assets.reduce((sum, a) => sum + (a.targetWeight || 0), 0).toFixed(2));
    const isWeightValid = totalWeight === 100;
    const isValid = isWeightValid && name.trim().length > 0 && assets.every(a => a.ticker.trim().length > 0);

    const handleSave = async () => {
        if (!isValid) return;
        setSaving(true);
        try {
            await updatePortfolio(portfolioId, { name, description });
            await savePortfolioAssets(
                portfolioId,
                assets.map(a => ({ ticker: a.ticker, targetWeight: a.targetWeight / 100 }))
            );
            router.push("/portfolios");
        } catch (error) {
            console.error(error);
            setToast({ message: "Erro ao salvar carteira.", type: "error" });
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center opacity-50">Carregando editor...</div>;
    }

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-4 mb-4">
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
                <Link href="/portfolios" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500">
                    <span className="material-icons">arrow_back</span>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Editar Portfólio</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Configure o nome e os ativos desta carteira alvo.</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Basic Info */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Informações Básicas</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome da Carteira</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Aposentadoria B3"
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Descrição (Opcional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Breve objetivo desta carteira..."
                                rows={3}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                            />
                        </div>
                    </div>
                </Card>

                {/* Assets */}
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ativos & Pesos Alvo</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Defina a porcentagem ideal de cada ticker.</p>
                        </div>
                        <button
                            onClick={handleAddAsset}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                        >
                            <span className="material-icons text-sm">add</span> Adicionar Ativo
                        </button>
                    </div>

                    <div className="space-y-3">
                        {assets.length === 0 && (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                                Nenhum ativo configurado. Adicione o primeiro ticker.
                            </div>
                        )}

                        {assets.map((asset, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="flex-1">
                                    <AssetAutocomplete
                                        value={asset.ticker}
                                        onChange={(val) => handleAssetChange(idx, "ticker", val)}
                                        placeholder="TICKER: (EX: ITUB3)"
                                    />
                                </div>
                                <div className="w-28 relative">
                                    <input
                                        type="number"
                                        value={asset.targetWeight || ""}
                                        onChange={(e) => handleAssetChange(idx, "targetWeight", e.target.value)}
                                        placeholder="10"
                                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-4 pr-8 text-sm text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">%</span>
                                </div>
                                <button
                                    onClick={() => handleRemoveAsset(idx)}
                                    className="p-2 text-slate-400 hover:text-danger-red dark:hover:text-red-400 transition-colors flex-shrink-0"
                                    title="Remover"
                                >
                                    <span className="material-icons text-xl">close</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                        <div className={`p-4 rounded-lg flex justify-between items-center ${isWeightValid ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'}`}>
                            <span className="font-semibold text-sm">Soma Total (Alvo: 100%):</span>
                            <span className="font-mono font-bold">{totalWeight.toFixed(2)}%</span>
                        </div>
                        {!isWeightValid && (
                            <p className="text-sm font-medium text-danger-red dark:text-red-400 flex items-center gap-1.5 px-1">
                                <span className="material-icons text-base">info</span>
                                A soma das porcentagens deve atingir exatamente 100% para salvar o portfólio.
                            </p>
                        )}
                    </div>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-4 mt-8">
                    <Link
                        href="/portfolios"
                        className="px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={!isValid || saving}
                        className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        {saving ? "Salvando..." : "Salvar Portfólio"}
                    </button>
                </div>
            </div>
        </div>
    );
}

"use client";

import { Card } from "@aporte/ui";
import { useState, useEffect } from "react";
import { getUserSettings, updateUserSettings } from "@/app/actions/settings";
import { seedAvailableAssets } from "@/app/actions/seed-assets";
import { Toast } from "@/components/Toast";

export default function SettingsPage() {
    const [settings, setSettings] = useState<{ defaultCurrency: string; contributionFrequency: string; defaultContribution: number; dripEnabled: boolean; b3Strict: boolean; discountInflation: boolean; defaultBenchmark: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        async function load() {
            const data = await getUserSettings();
            setSettings(data);
            setLoading(false);
        }
        load();
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await updateUserSettings({
                defaultCurrency: settings.defaultCurrency,
                contributionFrequency: settings.contributionFrequency,
                defaultContribution: Number(settings.defaultContribution),
                dripEnabled: settings.dripEnabled,
                b3Strict: settings.b3Strict,
                discountInflation: settings.discountInflation,
                defaultBenchmark: settings.defaultBenchmark,
            });
            setToast({ message: "Configurações salvas com sucesso!", type: "success" });
        } catch (error) {
            console.error(error);
            setToast({ message: "Erro ao salvar configurações.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleSeedAssets = async () => {
        setSaving(true);
        try {
            const result = await seedAvailableAssets();
            setToast({ message: `Sincronizado ${result.count} ativos com sucesso!`, type: "success" });
        } catch (error) {
            console.error(error);
            setToast({ message: "Erro ao sincronizar ativos.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center opacity-50">Carregando configurações...</div>;

    return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
            <div className="mb-8">
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configurações</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Preferências padrão para novas simulações.</p>
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-icons text-primary">tune</span>
                        Preferências Gerais
                    </h2>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Moeda Padrão</label>
                            <select
                                value={settings?.defaultCurrency || 'BRL'}
                                onChange={(e) => settings && setSettings({ ...settings, defaultCurrency: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors">
                                <option value="BRL">BRL (Real Brasileiro)</option>
                                <option value="USD">USD (Dólar Americano)</option>
                                <option value="EUR">EUR (Euro)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Frequência de Aporte</label>
                            <select
                                value={settings?.contributionFrequency || 'monthly'}
                                onChange={(e) => settings && setSettings({ ...settings, contributionFrequency: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors">
                                <option value="monthly">Mensal</option>
                                <option value="biweekly">Quinzenal</option>
                                <option value="weekly">Semanal</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                {settings?.contributionFrequency === 'weekly' ? 'Aporte Semanal Padrão' :
                                    settings?.contributionFrequency === 'biweekly' ? 'Aporte Quinzenal Padrão' :
                                        'Aporte Mensal Padrão'} ({settings?.defaultCurrency === 'USD' ? '$' : settings?.defaultCurrency === 'EUR' ? '€' : 'R$'})
                            </label>
                            <input
                                type="number"
                                value={settings?.defaultContribution || 0}
                                onChange={(e) => settings && setSettings({ ...settings, defaultContribution: Number(e.target.value) })}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                </Card>

                {/* Simulation Defaults */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-icons text-primary">science</span>
                        Padrões de Simulação
                    </h2>
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">Reinvestir Dividendos (DRIP)</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Reinveste automaticamente os dividendos no ativo de origem.</p>
                            </div>
                            <div
                                onClick={() => settings && setSettings({ ...settings, dripEnabled: !settings.dripEnabled })}
                                className={`w-11 h-6 ${settings?.dripEnabled ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'} rounded-full relative cursor-pointer flex-shrink-0 transition-colors`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings?.dripEnabled ? 'right-1' : 'left-1'}`} />
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700" />

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">Modo B3 Estrito</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Comprar apenas ações inteiras. Dinheiro restante fica em caixa (CDI).</p>
                            </div>
                            <div
                                onClick={() => settings && setSettings({ ...settings, b3Strict: !settings.b3Strict })}
                                className={`w-11 h-6 ${settings?.b3Strict ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'} rounded-full relative cursor-pointer flex-shrink-0 transition-colors`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings?.b3Strict ? 'right-1' : 'left-1'}`} />
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700" />

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">Descontar Inflação (IPCA)</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mostra retornos descontados pelo IPCA (poder de compra real).</p>
                            </div>
                            <div
                                onClick={() => settings && setSettings({ ...settings, discountInflation: !settings.discountInflation })}
                                className={`w-11 h-6 ${settings?.discountInflation ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'} rounded-full relative cursor-pointer flex-shrink-0 transition-colors`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings?.discountInflation ? 'right-1' : 'left-1'}`} />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Benchmark */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-icons text-primary">leaderboard</span>
                        Benchmark Padrão
                    </h2>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Índice de Comparação</label>
                            <select
                                value={settings?.defaultBenchmark || 'IBOV'}
                                onChange={(e) => settings && setSettings({ ...settings, defaultBenchmark: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors">
                                <option value="IBOV">IBOV (Índice Bovespa)</option>
                                <option value="CDI">CDI (Certificado de Depósito Interbancário)</option>
                                <option value="S&P 500">S&P 500</option>
                                <option value="IPCA + 6%">IPCA + 6%</option>
                            </select>
                        </div>
                        <div className="pt-6">
                            <button
                                onClick={handleSeedAssets}
                                disabled={saving}
                                className="text-primary hover:text-primary-hover text-sm font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                                title="Sincroniza a lista de tickers disponíveis no banco de dados local"
                            >
                                <span className="material-icons text-xl">sync</span>
                                Sincronizar Tickers
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                    >
                        {saving ? "Salvando..." : "Salvar Configurações"}
                    </button>
                </div>
            </div>
        </div>
    );
}

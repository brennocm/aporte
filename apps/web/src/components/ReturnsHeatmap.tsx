"use client";

/**
 * Heatmap de Retornos Mensais
 * Tabela que exibe retornos por mês (colunas) e ano (linhas),
 * colorindo de vermelho escuro (pior) ao verde forte (melhor).
 */

interface HeatmapProps {
    data: { date: string; return: number }[];
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function getCellColor(value: number | null): string {
    if (value === null) return "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600";
    if (value >= 5) return "bg-emerald-600 text-white";
    if (value >= 3) return "bg-emerald-500 text-white";
    if (value >= 1) return "bg-emerald-400 text-white";
    if (value >= 0) return "bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200";
    if (value >= -1) return "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200";
    if (value >= -3) return "bg-red-400 text-white";
    if (value >= -5) return "bg-red-500 text-white";
    return "bg-red-700 text-white";
}

export function ReturnsHeatmap({ data }: HeatmapProps) {
    const grouped: Record<number, (number | null)[]> = {};

    if (data && data.length > 0) {
        data.forEach(item => {
            if (!item || !item.date) return;
            const [yearStr, monthStr] = item.date.split('-');
            const year = parseInt(yearStr, 10);
            const monthIndex = parseInt(monthStr, 10) - 1;

            if (!grouped[year]) {
                grouped[year] = Array(12).fill(null);
            }
            grouped[year][monthIndex] = item.return * 100;
        });
    }

    const formattedData = Object.keys(grouped).sort().map(yearStr => ({
        year: parseInt(yearStr, 10),
        months: grouped[parseInt(yearStr, 10)]
    }));

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr>
                        <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400 font-semibold">Ano</th>
                        {MONTH_LABELS.map((m) => (
                            <th key={m} className="px-2 py-2 text-center text-slate-500 dark:text-slate-400 font-semibold">{m}</th>
                        ))}
                        <th className="px-3 py-2 text-center text-slate-500 dark:text-slate-400 font-semibold">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {formattedData.map((row) => {
                        const validMonths = row.months.filter((v): v is number => v !== null);
                        const yearTotal = validMonths.length > 0
                            ? validMonths.reduce((acc, v) => acc + v, 0)
                            : null;

                        return (
                            <tr key={row.year}>
                                <td className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-300">{row.year}</td>
                                {row.months.map((val, i) => (
                                    <td key={i} className="px-1 py-1">
                                        <div className={`rounded px-2 py-1.5 text-center font-mono font-medium ${getCellColor(val)}`}>
                                            {val !== null ? `${val > 0 ? "+" : ""}${val.toFixed(1)}%` : "–"}
                                        </div>
                                    </td>
                                ))}
                                <td className="px-1 py-1">
                                    <div className={`rounded px-2 py-1.5 text-center font-mono font-bold ${getCellColor(yearTotal)}`}>
                                        {yearTotal !== null ? `${yearTotal > 0 ? "+" : ""}${yearTotal.toFixed(1)}%` : "–"}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

"use client";

import { useEffect } from "react";
import { Card } from "@aporte/ui";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
    useEffect(() => {
        console.error("Dashboard ErrorBoundary caught error:", error);
    }, [error]);

    return (
        <div className="flex h-full w-full items-center justify-center p-6">
            <Card className="max-w-md w-full p-8 text-center space-y-4 shadow-sm">
                <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                    <span className="material-icons">error_outline</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Algo deu errado!</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Ocorreu um erro ao carregar esta funcionalidade ou ao se comunicar com o servidor.
                </p>
                <div className="pt-4">
                    <button
                        onClick={() => reset()}
                        className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </Card>
        </div>
    );
}

"use client";

import { registerUser } from "@/app/actions/auth";
import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData(e.currentTarget);
            const result = await registerUser(formData);

            if (result.success) {
                window.location.href = "/login";
            } else {
                setError(result.error || "Erro ao criar conta.");
                setLoading(false);
            }
        } catch {
            setError("Erro ao processar o cadastro. Tente novamente.");
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Aporte OSS</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Crie sua instância local</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-slate-900 dark:text-white">Username</label>
                            <input
                                name="username"
                                type="text"
                                required
                                placeholder="Seu username"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-slate-900 dark:text-white">Senha</label>
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-danger-red/10 border border-danger-red/20 rounded-md text-danger-red text-xs">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-md transition-colors shadow-sm mt-4"
                        >
                            {loading ? "Criando..." : "Criar Conta Local"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Já tem uma conta?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Entrar agora
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

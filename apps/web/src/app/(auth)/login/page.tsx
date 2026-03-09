"use client";

import { useActionState } from "react";
import { authenticate } from "@/app/actions/auth";
import { Button, Input, Card } from "@aporte/ui";
import Link from "next/link";

export default function LoginPage() {
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined,
    );

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark">
            <div className="w-full max-w-sm space-y-6">
                <div className="flex flex-col items-center space-y-2 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Aporte OSS
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Acesso a sua instância local
                    </p>
                </div>

                <Card className="p-6">
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="username"
                                className="text-sm font-medium leading-none text-slate-900 dark:text-white"
                            >
                                Username
                            </label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                required
                                placeholder="Seu username"
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium leading-none text-slate-900 dark:text-white"
                            >
                                Senha do Cofre
                            </label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="Sua senha"
                                className="w-full"
                            />
                        </div>

                        {errorMessage && (
                            <p className="text-sm text-red-500 font-medium">{errorMessage}</p>
                        )}

                        <Button
                            className="w-full mt-4"
                            type="submit"
                            aria-disabled={isPending}
                            disabled={isPending}
                        >
                            {isPending ? "Entrando..." : "Entrar"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Não tem uma conta? </span>
                        <Link href="/signup" className="text-primary hover:underline font-medium">
                            Criar Conta Local
                        </Link>
                    </div>
                </Card>
            </div>
        </main>
    );
}

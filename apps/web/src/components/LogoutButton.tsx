"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-red-500/10 group w-full"
            title="Encerrar Sessão"
        >
            <span className="material-icons mr-3 text-lg group-hover:text-red-500 transition-colors">logout</span>
            Sair
        </button>
    );
}

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { LogoutButton } from "./LogoutButton";


const navItems = [
    { href: "/simulation", icon: "play_arrow", label: "Simulação" },
    { href: "/portfolios", icon: "account_balance_wallet", label: "Carteiras" },
    { href: "/backtests", icon: "show_chart", label: "Histórico" },
    { href: "/settings", icon: "settings", label: "Configurações" },
];

export function Sidebar({ user }: { user?: { name?: string | null; email?: string | null } }) {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-slate-900 flex-shrink-0 flex flex-col border-r border-slate-800 hidden md:flex h-svh">
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-slate-800">
                <Link href="/simulation" className="flex items-center group">
                    <span className="text-xl font-bold text-white tracking-tight">Aporte OSS</span>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link key={item.href} href={item.href}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                            <span className="material-icons mr-3 text-lg">{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User Info & Footer */}
            <div className="p-4 border-t border-slate-800 space-y-4">
                {user && (
                    <div className="px-2 py-1">
                        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Usuário Logado</div>
                        <div className="text-sm text-slate-300 truncate font-medium">{user.name || user.email || 'Usuário'}</div>
                    </div>
                )}
                <LogoutButton />
                <div className="flex justify-center items-center">
                    <ThemeToggle />
                </div>
            </div>
        </aside>
    );
}

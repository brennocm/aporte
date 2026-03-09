import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";


export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 transition-colors duration-200">
      {/* Header / Nav */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">Aporte OSS</span>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Link href="https://github.com/brennocm/aporte" target="_blank" className="hover:text-primary transition-colors flex items-center gap-1">
              GitHub <span className="material-icons text-[14px]">open_in_new</span>
            </Link>
          </nav>
          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block" />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl relative z-10 space-y-8">

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-slate-900 dark:text-white leading-[1.1]">
            O motor de <span className="text-primary italic">backtesting</span><br />
            totalmente <span className="underline decoration-primary/30 underline-offset-8">local e privado</span>.
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Backtests de alta fidelidade e rebalanceamento automático com rigor matemático,
            sendo totalmente privado, rodando sob seu controle.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <button className="px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold rounded-2xl transition-all">
                Entrar na instância local
              </button>
            </Link>
          </div>

          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-1">
              <div className="text-primary font-bold">Privacy First</div>
              <div className="text-xs text-slate-500">Zero Telemetria</div>
            </div>
            <div className="space-y-1">
              <div className="text-primary font-bold">MathCore</div>
              <div className="text-xs text-slate-500">FastAPI + Pandas</div>
            </div>
            <div className="space-y-1">
              <div className="text-primary font-bold">Self-Hosted</div>
              <div className="text-xs text-slate-500">Docker + SQLite</div>
            </div>
            <div className="space-y-1">
              <div className="text-primary font-bold">Dev-Centric</div>
              <div className="text-xs text-slate-500">Next.js 15 + Prisma</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 flex items-center justify-center px-8 border-t border-slate-200 dark:border-slate-800 shrink-0 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
        <div>Aporte OSS - LICENÇA AGPL-3.0</div>
      </footer>
    </div>
  );
}

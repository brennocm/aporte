"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-transparent text-slate-400 hover:text-white"
        >
            <span className="material-icons text-lg">
                {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}

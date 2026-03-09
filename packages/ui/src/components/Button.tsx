import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "cta-dark";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", variant = "primary", ...props }, ref) => {
        const baseClass = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 cursor-pointer";

        const variants = {
            primary: "bg-primary text-white hover:bg-primary-hover border border-transparent shadow-sm",
            secondary: "bg-transparent border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100",
            ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
            "cta-dark": "bg-cta-dark text-white hover:bg-cta-dark-hover dark:bg-slate-800 dark:hover:bg-slate-700 border border-transparent shadow-sm"
        };

        return (
            <button
                ref={ref}
                className={`${baseClass} ${variants[variant]} ${className}`}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

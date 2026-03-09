import * as React from "react";

export interface ToggleSwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    variant?: "emerald" | "amber" | "primary";
}

export const ToggleSwitch = React.forwardRef<HTMLInputElement, ToggleSwitchProps>(
    ({ className = "", variant = "primary", ...props }, ref) => {
        const variantColors = {
            primary: "peer-checked:bg-primary",
            emerald: "peer-checked:bg-success-emerald",
            amber: "peer-checked:bg-warning-amber",
        };

        return (
            <label className={`relative inline-flex items-center cursor-pointer ${className}`}>
                <input type="checkbox" className="sr-only peer" ref={ref} {...props} />
                <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 ${variantColors[variant]}`}></div>
            </label>
        );
    }
);
ToggleSwitch.displayName = "ToggleSwitch";

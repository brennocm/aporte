import * as React from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    /* No additional props */
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = "", ...props }, ref) => {
        return (
            <select
                className={`flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 appearance-none ${className}`}
                ref={ref}
                {...props}
            />
        );
    }
);
Select.displayName = "Select";

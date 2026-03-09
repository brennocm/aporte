import * as React from "react"

export function Table({ className = "", ...props }: React.HTMLAttributes<HTMLTableElement>) {
    return (
        <div className="w-full overflow-auto">
            <table className={`w-full caption-bottom text-sm ${className}`} {...props} />
        </div>
    )
}

export function TableHeader({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <thead className={`border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 ${className}`} {...props} />
}

export function TableBody({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
}

export function TableRow({ className = "", ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr
            className={`border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50 data-[state=selected]:bg-slate-100 dark:data-[state=selected]:bg-slate-800 ${className}`}
            {...props}
        />
    )
}

export function TableHead({ className = "", ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            className={`h-12 px-4 text-left align-middle font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] ${className}`}
            {...props}
        />
    )
}

export function TableCell({ className = "", ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
    return (
        <td
            className={`p-4 align-middle ${className}`}
            {...props}
        />
    )
}

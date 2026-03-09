import * as React from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /* No additional props */
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = "", ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm bg-panel-light dark:bg-panel-dark text-slate-900 dark:text-slate-100 ${className}`}
                {...props}
            />
        );
    }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = "", ...props }, ref) => (
        <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
    )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className = "", ...props }, ref) => (
        <h3 ref={ref} className={`text-xl font-semibold leading-none tracking-tight ${className}`} {...props} />
    )
);
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = "", ...props }, ref) => (
        <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
    )
);
CardContent.displayName = "CardContent";

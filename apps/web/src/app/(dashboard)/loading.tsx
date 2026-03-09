"use client";

import { Card } from "@aporte/ui";

export default function Loading() {
    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-pulse text-slate-200 dark:text-slate-800">
            {/* Header Skeleton */}
            <div className="flex justify-between items-end mb-8">
                <div className="space-y-3 w-1/3">
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-3/4"></div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="p-6 h-40 flex flex-col justify-between border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                        <div className="space-y-3">
                            <div className="w-1/2 h-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            <div className="w-full h-8 bg-slate-100 dark:bg-slate-800/50 rounded mt-2"></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            <div className="w-12 h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { searchAssets } from "@/app/actions/portfolio";

interface AssetAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (asset: { ticker: string; name: string }) => void;
    placeholder?: string;
    className?: string;
}

export function AssetAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = "Buscar ativo...",
    className = ""
}: AssetAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<{ ticker: string; name: string }[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);

        if (val.length >= 2) {
            setLoading(true);
            setIsOpen(true);
            try {
                const results = await searchAssets(val);
                setSuggestions(results);
            } catch (err) {
                console.error("Autocomplete search error:", err);
            } finally {
                setLoading(false);
            }
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (asset: { ticker: string; name: string }) => {
        onChange(asset.ticker);
        setIsOpen(false);
        if (onSelect) onSelect(asset);
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <input
                type="text"
                value={value}
                onChange={handleInputChange}
                onFocus={() => value.length >= 2 && setIsOpen(true)}
                placeholder={placeholder}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            {isOpen && (suggestions.length > 0 || loading) && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-auto">
                    {loading ? (
                        <div className="px-4 py-2 text-sm text-slate-500 animate-pulse">Buscando...</div>
                    ) : (
                        suggestions.map((asset) => (
                            <div
                                key={asset.ticker}
                                onClick={() => handleSelect(asset)}
                                className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            >
                                <div className="text-sm font-bold text-slate-900 dark:text-white uppercase">{asset.ticker}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{asset.name}</div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

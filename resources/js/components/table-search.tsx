// components/table-search.tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";

interface TableSearchProps {
    value: string;
    onChange: (value: string) => void;
    onReset: () => void;
    placeholder?: string;
    className?: string;
    debounceMs?: number;
    showResetButton?: boolean;
}

export function TableSearch({
    value,
    onChange,
    onReset,
    placeholder = "Search...",
    className = "",
    debounceMs = 300,
    showResetButton = true,
}: TableSearchProps) {
    const [localValue, setLocalValue] = useState(value);
    const debouncedValue = useDebounce(localValue, debounceMs);

    // Update local value when prop value changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Trigger onChange when debounced value changes
    useEffect(() => {
        onChange(debouncedValue);
    }, [debouncedValue, onChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
    };

    const handleReset = () => {
        setLocalValue('');
        onReset();
    };

    return (
        <div className={`flex items-center gap-2 w-full sm:w-auto ${className}`}>
            <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    value={localValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full sm:w-80 h-10 pl-9 pr-8"
                />
                {localValue && (
                    <button
                        onClick={handleReset}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
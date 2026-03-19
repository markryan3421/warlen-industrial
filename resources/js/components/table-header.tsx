// components/table-header.tsx
import { ReactNode } from "react";
import { TableSearch } from "./table-search";

interface TableHeaderProps {
    title: string;
    icon?: ReactNode;
    description?: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    onSearchReset: () => void;
    searchPlaceholder?: string;
    filters?: ReactNode;
    className?: string;
    showTitle?: boolean;
}

export function TableHeader({
    title,
    icon,
    description,
    searchValue,
    onSearchChange,
    onSearchReset,
    searchPlaceholder,
    filters,
    className = "",
    showTitle = true,
}: TableHeaderProps) {
    return (
        <div className="space-y-4">
            {/* Page Header - Optional */}
            {showTitle && (icon || description) && (
                <div className="flex items-center gap-4 ms-4 mb-4">
                    {icon && (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            {icon}
                        </div>
                    )}
                    {(title || description) && (
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                            {description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Search and Filters Bar */}
            <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${className}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                    <TableSearch
                        value={searchValue}
                        onChange={onSearchChange}
                        onReset={onSearchReset}
                        placeholder={searchPlaceholder || `Search ${title.toLowerCase()}...`}
                    />
                    
                    {filters && (
                        <div className="flex items-center gap-2">
                            {filters}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
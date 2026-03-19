// components/table-search-header.tsx
import { TableSearch } from "./table-search";

interface TableSearchHeaderProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onSearchReset: () => void;
    searchPlaceholder?: string;
    filters?: React.ReactNode;
    className?: string;
}

export function TableSearchHeader({
    searchValue,
    onSearchChange,
    onSearchReset,
    searchPlaceholder,
    filters,
    className = "",
}: TableSearchHeaderProps) {
    return (
        <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full ${className}`}>
            <TableSearch
                value={searchValue}
                onChange={onSearchChange}
                onReset={onSearchReset}
                placeholder={searchPlaceholder}
            />
            
            {filters && (
                <div className="flex items-center gap-2">
                    {filters}
                </div>
            )}
        </div>
    );
}
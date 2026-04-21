// components/application-leave/application-leave-filter-bar.tsx
import { X } from 'lucide-react';
import { SearchInput, SingleSelectPopover, StatusFilter } from '@/components/filters/filter-primitives';
import { cn } from '@/lib/utils';

export interface ApplicationLeaveFilterConfig {
    /** Show search input */
    search?: boolean;
    /** Show status filter */
    status?: boolean;
}

interface ApplicationLeaveFilterBarProps {
    // Filter values
    searchTerm?: string;
    status?: string;  // '' = all | 'pending' | 'approved' | 'rejected' | 'submitted'
    
    // Change handlers
    onSearchChange?: (value: string) => void;
    onStatusChange?: (status: string) => void;
    
    // Clear all
    onClearAll?: () => void;
    
    // Configuration
    filters?: ApplicationLeaveFilterConfig;
    searchPlaceholder?: string;
    statusOptions?: Array<{ value: string; label: string }>;
}

export function ApplicationLeaveFilterBar({
    searchTerm = '',
    status = '',
    onSearchChange,
    onStatusChange,
    onClearAll,
    filters = {
        search: true,
        status: true,
    },
    searchPlaceholder = "Search by employee name or code...",
    statusOptions = [],
}: ApplicationLeaveFilterBarProps) {
    // Check if any filter is active
    const hasActiveFilters = !!(
        (filters.search && searchTerm?.trim()) ||
        (filters.status && status !== '')
    );

    // Count active filters for display
    const activeFilterCount = [
        (filters.search && searchTerm?.trim()) ? 1 : 0,
        (filters.status && status !== '') ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    // Check if there are any filters enabled besides search
    const hasOtherFilters = filters.status;

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            {filters.search && onSearchChange && (
                <SearchInput
                    value={searchTerm}
                    onChange={onSearchChange}
                    placeholder={searchPlaceholder}
                />
            )}

            {/* Divider - only show if search is shown and there are other filters */}
            {filters.search && hasOtherFilters && (
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 flex-shrink-0 mx-0.5" />
            )}

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {filters.status && onStatusChange && (
                    <SingleSelectPopover
                        label="Status"
                        options={statusOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                        value={status === '' ? undefined : status}
                        onChange={(value) => onStatusChange(value || '')}
                        placeholder="All Statuses"
                    />
                )}
            </div>

            {/* Clear all — only when something is active */}
            {hasActiveFilters && onClearAll && (
                <button
                    onClick={onClearAll}
                    className={cn(
                        'inline-flex items-center gap-1 h-9 px-2.5 rounded-lg text-xs font-semibold',
                        'text-slate-400 dark:text-slate-500',
                        'hover:text-[#d85e39] dark:hover:text-orange-400',
                        'hover:bg-[#d85e39]/8 dark:hover:bg-[#d85e39]/15',
                        'border border-transparent hover:border-[#d85e39]/20',
                        'transition-all duration-150',
                    )}
                >
                    <X className="h-3.5 w-3.5" />
                    Clear {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>
            )}
        </div>
    );
}
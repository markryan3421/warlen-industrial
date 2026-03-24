/**
 * reusable-filter-bar.tsx
 *
 * Reusable filter bar for any table/list page.
 * Configurable to show/hide specific filters based on the context.
 * All controls are h-9 (36px) to match the table's internal density.
 * 
 * This component is purely presentational — all state management is handled
 * by the parent component (like employees/index.tsx or branches/index.tsx).
 */

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    SearchInput,
    MultiSelectPopover,
    SingleSelectPopover,
    DateRangePicker,
    StatusFilter,
} from '@/components/filters/filter-primitives';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BranchData {
    id: number;
    branch_name: string;
    branch_address: string;
    sites: Array<{ id: number; site_name: string }>;
}

export interface FilterConfig {
    /** Show search input */
    search?: boolean;
    /** Show position filter */
    position?: boolean;
    /** Show branch filter */
    branch?: boolean;
    /** Show site filter */
    site?: boolean;
    /** Show date range filter */
    date?: boolean;
    /** Show status filter (active/inactive) */
    status?: boolean;
}

interface EmployeeFilterBarProps {
    // Data
    allPositions?: string[];
    branchesData?: BranchData[];
    
    // Filter values
    searchTerm?: string;
    selectedPositions?: string[];
    selectedBranch?: string;
    selectedSite?: string;
    status?: string;  // '' = all | 'active' | 'inactive'
    dateFrom?: Date | undefined;
    dateTo?: Date | undefined;
    
    // Change handlers
    onSearchChange?: (value: string) => void;
    onPositionsChange?: (positions: string[]) => void;
    onBranchChange?: (branch: string) => void;
    onSiteChange?: (site: string) => void;
    onStatusChange?: (status: string) => void;
    onDateFromChange?: (date: Date | undefined) => void;
    onDateToChange?: (date: Date | undefined) => void;
    
    // Clear all
    onClearAll?: () => void;
    
    // Configuration
    filters?: FilterConfig;
    searchPlaceholder?: string;
    /** Optional label for the date range picker (defaults to "Date") */
    dateLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EmployeeFilterBar({
    allPositions = [],
    branchesData = [],
    searchTerm = '',
    selectedPositions = [],
    selectedBranch,
    selectedSite,
    status = '',
    dateFrom,
    dateTo,
    onSearchChange,
    onPositionsChange,
    onBranchChange,
    onSiteChange,
    onStatusChange,
    onDateFromChange,
    onDateToChange,
    onClearAll,
    filters = {
        search: true,
        position: true,
        branch: true,
        site: true,
        date: true,
        status: true,
    },
    searchPlaceholder = "Search...",
    dateLabel = "Date",
}: EmployeeFilterBarProps) {

    // searchTerm + onSearchChange
    // selectedPositions + onPositionChange
    // selectedBranch + onBranchChange
    // selectedSite + onSiteChange
    // status + onStatusChange
    // dateFrom + onDateFromChange
    // dateTo + onDateToChange

    const branchOptions = useMemo(
        () => branchesData.map(b => ({ value: b.branch_name, label: b.branch_name })),
        [branchesData],
    );

    const siteOptions = useMemo(() => {
        if (!selectedBranch) return [];
        const branch = branchesData.find(b => b.branch_name === selectedBranch);
        return (branch?.sites ?? []).map(s => ({ value: s.site_name, label: s.site_name }));
    }, [branchesData, selectedBranch]);

    // Check if any filter is active
    const hasActiveFilters = !!(
        (filters.search && searchTerm?.trim()) ||
        (filters.position && selectedPositions.length) ||
        (filters.branch && selectedBranch) ||
        (filters.site && selectedSite) ||
        (filters.status && status !== '') ||
        (filters.date && (dateFrom || dateTo))
    );

    // Count active filters for display
    const activeFilterCount = [
        (filters.search && searchTerm?.trim()) ? 1 : 0,
        (filters.position && selectedPositions.length) ? 1 : 0,
        (filters.branch && selectedBranch) ? 1 : 0,
        (filters.site && selectedSite) ? 1 : 0,
        (filters.status && status !== '') ? 1 : 0,
        (filters.date && (dateFrom || dateTo)) ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    // Check if there are any filters enabled besides search
    const hasOtherFilters = filters.position || filters.branch || filters.site || filters.date || filters.status;

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
                {filters.position && onPositionsChange && (
                    <MultiSelectPopover
                        label="Position"
                        options={allPositions}
                        selected={selectedPositions}
                        onChange={onPositionsChange}
                    />
                )}

                {filters.branch && onBranchChange && (
                    <SingleSelectPopover
                        label="Branch"
                        options={branchOptions}
                        value={selectedBranch}
                        onChange={onBranchChange}
                        placeholder="Branch"
                    />
                )}

                {filters.site && selectedBranch && onSiteChange && (
                    <SingleSelectPopover
                        label="Site"
                        options={siteOptions}
                        value={selectedSite}
                        onChange={onSiteChange}
                        placeholder="Site"
                    />
                )}

                {filters.date && onDateFromChange && onDateToChange && (
                    <DateRangePicker
                        label={dateLabel}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onFromChange={onDateFromChange}
                        onToChange={onDateToChange}
                        placeholder={dateLabel}
                    />
                )}

                {filters.status && onStatusChange && (
                    <StatusFilter
                        value={status as '' | 'active' | 'inactive'}
                        onChange={onStatusChange}
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


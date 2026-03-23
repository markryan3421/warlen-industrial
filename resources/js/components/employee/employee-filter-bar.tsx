/**
 * employee-filter-bar.tsx
 *
 * Compact toolbar for any employee list page.
 * Designed to sit inside the CustomTable `toolbar` slot — between the navy
 * header and the column headers.
 *
 * Layout (single row, h-9 controls):
 *   [Search] | [Position ▾] [Branch ▾] [↳ Site ▾] [Date] [Active only ◉]   [× Clear]
 *
 * All controls are h-9 (36px) to match the table's internal density.
 * No floating labels above inputs — label text is embedded in the trigger.
 * Active filters glow navy, matching CustomTable's brand system.
 * Clear button only appears when at least one filter is active.
 * This component is purely presentational — no state.
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

interface EmployeeFilterBarProps {
    allPositions: string[];
    branchesData: BranchData[];
    searchTerm: string;
    selectedPositions: string[];
    selectedBranch: string;
    selectedSite: string;
    /** '' = all (default) | 'active' | 'inactive' */
    status: string;
    dateFrom: Date | undefined;
    dateTo: Date | undefined;
    onSearchChange: (value: string) => void;
    onPositionsChange: (positions: string[]) => void;
    onBranchChange: (branch: string) => void;
    onSiteChange: (site: string) => void;
    onStatusChange: (status: string) => void;
    onDateFromChange: (date: Date | undefined) => void;
    onDateToChange: (date: Date | undefined) => void;
    /** When provided, a "Clear" button appears whenever any filter is active */
    onClearAll?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EmployeeFilterBar({
    // Data
    allPositions, branchesData,

    // Initial Data
    searchTerm, selectedPositions, selectedBranch, selectedSite,
    status, dateFrom, dateTo,

    // Callbacks or FilteredData
    onSearchChange, onPositionsChange, onBranchChange, onSiteChange,
    onStatusChange, onDateFromChange, onDateToChange,

    // Clear
    onClearAll,
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

    const hasActiveFilters = !!(
        searchTerm.trim() || selectedPositions.length || selectedBranch ||
        selectedSite || status !== '' || dateFrom || dateTo
    );

    return (
        <div className="flex items-center gap-2 flex-wrap">

            {/* Search */}
            <SearchInput
                value={searchTerm}
                onChange={onSearchChange}
                placeholder="Search by ID or name…"
            />

            {/* Hairline divider */}
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 flex-shrink-0 mx-0.5" />

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">

                <MultiSelectPopover
                    label="Position"
                    options={allPositions}
                    selected={selectedPositions}
                    onChange={onPositionsChange}
                />

                <SingleSelectPopover
                    label="Branch"
                    options={branchOptions}
                    value={selectedBranch}
                    onChange={onBranchChange}
                    placeholder="Branch"
                />

                {selectedBranch && (
                    <SingleSelectPopover
                        label="Site"
                        options={siteOptions}
                        value={selectedSite}
                        onChange={onSiteChange}
                        placeholder="Site"
                    />
                )}

                <DateRangePicker
                    label="Hire Date"
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onFromChange={onDateFromChange}
                    onToChange={onDateToChange}
                    placeholder="Hire date"
                />

                <StatusFilter
                    value={status as '' | 'active' | 'inactive'}
                    onChange={onStatusChange}
                />
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
                    Clear
                </button>
            )}
        </div>
    );
}
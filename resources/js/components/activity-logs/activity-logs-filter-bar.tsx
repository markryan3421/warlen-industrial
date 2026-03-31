// components/activity-logs/activity-logs-filter-bar.tsx

import { X } from 'lucide-react';
import {
    SearchInput,
    SingleSelectPopover,
} from '@/components/filters/filter-primitives';
import { cn } from '@/lib/utils';

export interface FilterConfig {
    search?: boolean;
    action?: boolean;
    model?: boolean;
    user?: boolean;
}

interface ActivityLogsFilterBarProps {
    searchTerm?: string;
    actionFilter?: string;
    modelFilter?: string;
    userFilter?: string;
    availableActions?: string[];
    availableModels?: string[];
    availableUsers?: { id: string; name: string }[];
    onSearchChange?: (value: string) => void;
    onActionChange?: (value: string) => void;
    onModelChange?: (value: string) => void;
    onUserChange?: (value: string) => void;
    onClearAll?: () => void;
    filters?: FilterConfig;
    searchPlaceholder?: string;
}

export function ActivityLogsFilterBar({
    searchTerm = '',
    actionFilter = 'all',
    modelFilter = 'all',
    userFilter = 'all',
    availableActions = [],
    availableModels = [],
    availableUsers = [],
    onSearchChange,
    onActionChange,
    onModelChange,
    onUserChange,
    onClearAll,
    filters = { search: true, action: true, model: true, user: true },
    searchPlaceholder = "Search logs...",
}: ActivityLogsFilterBarProps) {

    // Action options with "All Actions" as default
    const actionOptions = [
        { value: 'all', label: 'All Actions' },
        ...availableActions.map(action => ({
            value: action,
            label: action.charAt(0).toUpperCase() + action.slice(1)
        }))
    ];

    // Model options with "All Models" as default
    const modelOptions = [
        { value: 'all', label: 'All Models' },
        ...availableModels.map(model => ({ value: model, label: model }))
    ];

    // User options with "All Users" as default
    const userOptions = [
        { value: 'all', label: 'All Users' },
        ...availableUsers.map(user => ({ value: user.id, label: user.name }))
    ];

    // Get display label for active filter
    const getActionDisplay = () => {
        if (actionFilter === 'all') return 'All Actions';
        const found = availableActions.find(a => a === actionFilter);
        return found ? found.charAt(0).toUpperCase() + found.slice(1) : actionFilter;
    };

    const getModelDisplay = () => {
        if (modelFilter === 'all') return 'All Models';
        return modelFilter;
    };

    const getUserDisplay = () => {
        if (userFilter === 'all') return 'All Users';
        const found = availableUsers.find(u => u.id === userFilter);
        return found?.name || userFilter;
    };

    // Check if any filter is active
    const hasActiveFilters = !!(
        (filters.search && searchTerm?.trim()) ||
        (filters.action && actionFilter !== 'all') ||
        (filters.model && modelFilter !== 'all') ||
        (filters.user && userFilter !== 'all')
    );

    // Count active filters for display
    const activeFilterCount = [
        (filters.search && searchTerm?.trim()) ? 1 : 0,
        (filters.action && actionFilter !== 'all') ? 1 : 0,
        (filters.model && modelFilter !== 'all') ? 1 : 0,
        (filters.user && userFilter !== 'all') ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const hasOtherFilters = filters.action || filters.model || filters.user;

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            {filters.search && onSearchChange && (
                <SearchInput
                    value={searchTerm}
                    onChange={onSearchChange}
                    placeholder={searchPlaceholder}
                />
            )}

            {/* Divider */}
            {filters.search && hasOtherFilters && (
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 flex-shrink-0 mx-0.5" />
            )}

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {/* Action Filter */}
                {filters.action && onActionChange && (
                    <SingleSelectPopover
                        label="Action"
                        options={actionOptions}
                        value={actionFilter}
                        onChange={onActionChange}
                        placeholder="All Actions"
                    />
                )}

                {/* Model Filter */}
                {filters.model && onModelChange && (
                    <SingleSelectPopover
                        label="Model"
                        options={modelOptions}
                        value={modelFilter}
                        onChange={onModelChange}
                        placeholder="All Models"
                    />
                )}

                {/* User Filter */}
                {filters.user && onUserChange && (
                    <SingleSelectPopover
                        label="User"
                        options={userOptions}
                        value={userFilter}
                        onChange={onUserChange}
                        placeholder="All Users"
                    />
                )}
            </div>

            {/* Clear All Button */}
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
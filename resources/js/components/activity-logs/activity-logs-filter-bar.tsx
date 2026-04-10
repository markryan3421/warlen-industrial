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

    // Always include all action types
    const ALL_ACTIONS = ['created', 'updated', 'deleted'];
    
    // Combine available actions with all possible actions, ensuring no duplicates
    const uniqueActions = [...new Set([...ALL_ACTIONS, ...availableActions])];
    
    // Action options with "All Actions" as default - just labels without counts
    const actionOptions = [
        { value: 'all', label: 'All Actions' },
        ...uniqueActions.map(action => ({
            value: action,
            label: action.charAt(0).toUpperCase() + action.slice(1)
        }))
    ];

    // Helper function to format model name (capitalize first letter of each word)
    const formatModelName = (model: string): string => {
        // Split by spaces, underscores, or camelCase
        let words: string[] = [];
        
        // Check if the model name contains underscores or spaces
        if (model.includes('_') || model.includes(' ')) {
            // Split by underscore or space
            words = model.split(/[_\s]+/);
        } else {
            // Split camelCase into words
            words = model.split(/(?=[A-Z])/);
            // Filter out empty strings
            words = words.filter(w => w.length > 0);
        }
        
        // Capitalize first letter of each word and join with space
        const formatted = words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        
        return formatted;
    };

    // Model options with "All Models" as default, with formatted names
    const modelOptions = [
        { value: 'all', label: 'All Models' },
        ...availableModels.map(model => ({ 
            value: model, 
            label: formatModelName(model)
        }))
    ];

    // User options with "All Users" as default
    const userOptions = [
        { value: 'all', label: 'All Users' },
        ...availableUsers.map(user => ({ value: user.id, label: user.name }))
    ];

    // Check if any filter is ACTUALLY active (non-default values or search has value)
    const hasActiveFilters = !!(
        (filters.search && searchTerm?.trim()) ||
        (filters.action && actionFilter !== 'all') ||
        (filters.model && modelFilter !== 'all') ||
        (filters.user && userFilter !== 'all')
    );

    // Count active filters (only count non-default values)
    const activeFilterCount = [
        (filters.search && searchTerm?.trim()) ? 1 : 0,
        (filters.action && actionFilter !== 'all') ? 1 : 0,
        (filters.model && modelFilter !== 'all') ? 1 : 0,
        (filters.user && userFilter !== 'all') ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const hasOtherFilters = filters.action || filters.model || filters.user;

    // Get the current display label for the action filter
    const getActionDisplayLabel = () => {
        const selected = actionOptions.find(opt => opt.value === actionFilter);
        return selected?.label || 'All Actions';
    };

    // Get the current display label for the model filter (formatted)
    const getModelDisplayLabel = () => {
        if (modelFilter === 'all') return 'All Models';
        const formatted = formatModelName(modelFilter);
        return formatted;
    };

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

            {/* Filter Dropdowns - Always show as dropdowns, not active pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {/* Action Filter - Shows "All Actions" without active styling */}
                {filters.action && onActionChange && (
                    <SingleSelectPopover
                        label="Action"
                        options={actionOptions}
                        value={actionFilter}
                        onChange={onActionChange}
                        placeholder="All Actions"
                        showActiveState={false}
                    />
                )}

                {/* Model Filter - Shows "All Models" without active styling */}
                {filters.model && onModelChange && (
                    <SingleSelectPopover
                        label="Model"
                        options={modelOptions}
                        value={modelFilter}
                        onChange={onModelChange}
                        placeholder="All Models"
                        showActiveState={false}
                    />
                )}

                {/* User Filter - Shows "All Users" without active styling */}
                {filters.user && onUserChange && (
                    <SingleSelectPopover
                        label="User"
                        options={userOptions}
                        value={userFilter}
                        onChange={onUserChange}
                        placeholder="All Users"
                        showActiveState={false}
                    />
                )}
            </div>

            {/* Clear All Button - Only shows when there are ACTIVE filters (non-default) */}
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
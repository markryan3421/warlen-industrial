/**
 * filter-primitives.tsx
 *
 * Generic, fully reusable filter components with zero domain knowledge.
 * Use these anywhere in the system — employees, payroll, attendance, etc.
 *
 * Components exported:
 *   SearchInput        — compact text search with clear button
 *   MultiSelectPopover — badge-pill multi-select with inner search
 *   SingleSelectPopover — searchable single-value picker
 *   DateRangePicker    — dual-month calendar popover with clear
 *   ActiveSwitch       — pill-style boolean toggle (no box border)
 *
 * Design system:
 *   All controls are h-9 (36px) so they sit cleanly in a table toolbar.
 *   Active state uses the project navy (#1d4791) consistently — no ShadCN
 *   "primary" colour leakage.
 *   Labels are embedded as placeholder text inside triggers, not floating
 *   above — the "label above" pattern is for forms, not toolbars.
 *
 * All components are controlled (value + onChange) — the caller owns state.
 */

import { useState, useMemo } from 'react';
import { Search, X, ChevronDown, Check, Calendar, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// Label and Switch removed — StatusFilter uses popover instead
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ─── Design tokens ────────────────────────────────────────────────────────────
// These match the CustomTable brand system exactly.
const NAVY = '#1d4791';
const NAVY_CLS = {
    ring: 'ring-1 ring-[#1d4791]/50 border-[#1d4791]/50',
    text: 'text-[#1d4791] dark:text-blue-300',
    bg: 'bg-[#1d4791]/8 dark:bg-[#1d4791]/20',
    hover: 'hover:bg-[#1d4791]/8 dark:hover:bg-[#1d4791]/15 hover:text-[#1d4791] dark:hover:text-blue-300',
    selected: 'bg-[#1d4791] text-white hover:bg-[#1d4791]/90',
};

// ─────────────────────────────────────────────────────────────────────────────
// SearchInput
// ─────────────────────────────────────────────────────────────────────────────
interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchInput({
    value,
    onChange,
    placeholder = 'Search...',
    className,
}: SearchInputProps) {
    return (
        <div className={cn('relative flex-1 min-w-[180px] max-w-xs', className)}>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                className={cn(
                    'pl-8 pr-8 h-9 text-sm bg-white dark:bg-slate-900',
                    'border-slate-200 dark:border-slate-700',
                    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                    'focus-visible:ring-1 focus-visible:ring-[#1d4791]/40 focus-visible:border-[#1d4791]/50',
                    value && 'border-[#1d4791]/50 ring-1 ring-[#1d4791]/20',
                )}
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label="Clear search"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MultiSelectPopover
// ─────────────────────────────────────────────────────────────────────────────
interface MultiSelectPopoverProps {
    label?: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    width?: string;
    className?: string;
}

export function MultiSelectPopover({
    label,
    options,
    selected,
    onChange,
    placeholder = 'Filter...',
    width = 'w-auto',
    className,
}: MultiSelectPopoverProps) {
    const [open, setOpen] = useState(false);
    const [innerSearch, setInnerSearch] = useState('');

    const filtered = useMemo(() => {
        const q = innerSearch.trim().toLowerCase();
        return q ? options.filter(o => o.toLowerCase().includes(q)) : options;
    }, [options, innerSearch]);

    const toggle = (value: string) => {
        onChange(
            selected.includes(value)
                ? selected.filter(v => v !== value)
                : [...selected, value]
        );
    };

    const isActive = selected.length > 0;

    return (
        <div className={cn('flex flex-col', className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium',
                            'border transition-all duration-150 whitespace-nowrap',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4791]/40',
                            isActive
                                ? 'border-[#1d4791]/50 bg-[#1d4791]/8 dark:bg-[#1d4791]/20 text-[#1d4791] dark:text-blue-300 ring-1 ring-[#1d4791]/20'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 hover:border-[#1d4791]/40 hover:text-[#1d4791] dark:hover:text-blue-300',
                        )}
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{label ?? placeholder}</span>
                        {isActive && (
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1d4791] text-white text-[10px] font-black leading-none">
                                {selected.length}
                            </span>
                        )}
                        <ChevronDown className={cn('h-3.5 w-3.5 flex-shrink-0 opacity-50 transition-transform duration-150', open && 'rotate-180')} />
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    className="w-[300px] p-0 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/40"
                    align="start"
                    sideOffset={6}
                >
                    {/* Popover header */}
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            {label}
                        </p>
                        {selected.length > 0 && (
                            <button
                                onClick={() => onChange([])}
                                className="text-[11px] font-semibold text-[#d85e39] hover:text-[#d85e39]/80 transition-colors"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Inner search */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            <Input
                                placeholder={`Search ${label?.toLowerCase() ?? 'options'}...`}
                                value={innerSearch}
                                onChange={e => setInnerSearch(e.target.value)}
                                className="pl-8 pr-7 h-8 text-xs border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
                            />
                            {innerSearch && (
                                <button
                                    onClick={() => setInnerSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="max-h-[240px] overflow-y-auto p-1.5">
                        {filtered.length === 0 ? (
                            <p className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">No options found</p>
                        ) : (
                            <div className="flex flex-col gap-0.5">
                                {filtered.map(option => {
                                    const isSelected = selected.includes(option);
                                    return (
                                        <button
                                            key={option}
                                            onClick={() => toggle(option)}
                                            className={cn(
                                                'flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-sm text-left transition-all duration-100',
                                                isSelected
                                                    ? 'bg-[#1d4791]/10 dark:bg-[#1d4791]/20 text-[#1d4791] dark:text-blue-300 font-medium'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60',
                                            )}
                                        >
                                            <span className="truncate">{option}</span>
                                            {isSelected && (
                                                <Check className="h-3.5 w-3.5 flex-shrink-0 text-[#1d4791] dark:text-blue-300" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SingleSelectPopover
// ─────────────────────────────────────────────────────────────────────────────
interface SelectOption {
    value: string;
    label: string;
}

interface SingleSelectPopoverProps {
    label?: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    width?: string;
    className?: string;
}

export function SingleSelectPopover({
    label,
    options,
    value,
    onChange,
    placeholder = 'Select...',
    width = 'w-auto',
    className,
}: SingleSelectPopoverProps) {
    const [open, setOpen] = useState(false);
    const [innerSearch, setInnerSearch] = useState('');

    const filtered = useMemo(() => {
        const q = innerSearch.trim().toLowerCase();
        return q ? options.filter(o => o.label.toLowerCase().includes(q)) : options;
    }, [options, innerSearch]);

    const handleSelect = (optValue: string) => {
        onChange(value === optValue ? '' : optValue);
    };

    const selectedLabel = options.find(o => o.value === value)?.label;
    const isActive = !!value;

    return (
        <div className={cn('flex flex-col', className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium',
                            'border transition-all duration-150 whitespace-nowrap',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4791]/40',
                            isActive
                                ? 'border-[#1d4791]/50 bg-[#1d4791]/8 dark:bg-[#1d4791]/20 text-[#1d4791] dark:text-blue-300 ring-1 ring-[#1d4791]/20'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 hover:border-[#1d4791]/40 hover:text-[#1d4791] dark:hover:text-blue-300',
                        )}
                    >
                        <span>{isActive ? selectedLabel : (label ?? placeholder)}</span>
                        {isActive && (
                            <button
                                onClick={e => { e.stopPropagation(); onChange(''); setOpen(false); }}
                                className="text-[#1d4791]/60 hover:text-[#1d4791] dark:text-blue-300/60 dark:hover:text-blue-200 transition-colors"
                                aria-label="Clear"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                        {!isActive && (
                            <ChevronDown className={cn('h-3.5 w-3.5 flex-shrink-0 opacity-50 transition-transform duration-150', open && 'rotate-180')} />
                        )}
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    className="w-[220px] p-0 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/40"
                    align="start"
                    sideOffset={6}
                >
                    {/* Popover header */}
                    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            {label}
                        </p>
                    </div>

                    {/* Inner search */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            <Input
                                placeholder={`Search ${label?.toLowerCase() ?? 'options'}...`}
                                value={innerSearch}
                                onChange={e => setInnerSearch(e.target.value)}
                                className="pl-8 pr-7 h-8 text-xs border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
                                autoFocus
                            />
                            {innerSearch && (
                                <button
                                    onClick={() => setInnerSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="max-h-[240px] overflow-y-auto p-1.5">
                        {filtered.length === 0 ? (
                            <p className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">No options found</p>
                        ) : (
                            <div className="flex flex-col gap-0.5">
                                {filtered.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className={cn(
                                            'flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-sm text-left transition-all duration-100',
                                            value === option.value
                                                ? 'bg-[#1d4791]/10 dark:bg-[#1d4791]/20 text-[#1d4791] dark:text-blue-300 font-medium'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60',
                                        )}
                                    >
                                        <span className="truncate">{option.label}</span>
                                        {value === option.value && (
                                            <Check className="h-3.5 w-3.5 flex-shrink-0 text-[#1d4791] dark:text-blue-300" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// DateRangePicker
// ─────────────────────────────────────────────────────────────────────────────
interface DateRangePickerProps {
    label?: string;
    dateFrom: Date | undefined;
    dateTo: Date | undefined;
    onFromChange?: (date: Date | undefined) => void;
    onToChange?: (date: Date | undefined) => void;
    onRangeChange?: (range: { from: Date | undefined; to: Date | undefined }) => void;
    placeholder?: string;
    className?: string;
}

export function DateRangePicker({
    label,
    dateFrom,
    dateTo,
    onFromChange,
    onToChange,
    onRangeChange,
    placeholder = 'Date range',
    className,
}: DateRangePickerProps) {
    const now = new Date();
    const [leftMonth, setLeftMonth] = useState<Date>(now);
    const [rightMonth, setRightMonth] = useState<Date>(() => {
        const d = new Date(now);
        d.setMonth(d.getMonth() + 1);
        return d;
    });

    const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
        const from = range?.from;
        const to = range?.to;
        if (onRangeChange) { onRangeChange({ from, to }); }
        else { onFromChange?.(from); onToChange?.(to); }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRangeChange) { onRangeChange({ from: undefined, to: undefined }); }
        else { onFromChange?.(undefined); onToChange?.(undefined); }
    };

    const hasRange = !!(dateFrom || dateTo);

    const displayText = hasRange
        ? [dateFrom && format(dateFrom, 'MMM d, yyyy'), dateTo && format(dateTo, 'MMM d, yyyy')]
            .filter(Boolean).join(' – ')
        : (label ?? placeholder);

    return (
        <div className={cn(className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium',
                            'border transition-all duration-150 whitespace-nowrap max-w-[260px]',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4791]/40',
                            hasRange
                                ? 'border-[#1d4791]/50 bg-[#1d4791]/8 dark:bg-[#1d4791]/20 text-[#1d4791] dark:text-blue-300 ring-1 ring-[#1d4791]/20'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 hover:border-[#1d4791]/40 hover:text-[#1d4791] dark:hover:text-blue-300',
                        )}
                    >
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{displayText}</span>
                        {hasRange && (
                            <button
                                onClick={handleClear}
                                className="flex-shrink-0 text-[#1d4791]/60 hover:text-[#1d4791] dark:text-blue-300/60 dark:hover:text-blue-200 transition-colors"
                                title="Clear date filter"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl" align="start" sideOffset={6}>
                    {/* Header */}
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            {label ?? 'Date Range'}
                        </p>
                    </div>
                    <div className="flex">
                        <div className="border-r border-slate-100 dark:border-slate-800">
                            <CalendarComponent
                                mode="range"
                                selected={{ from: dateFrom, to: dateTo }}
                                onSelect={handleSelect}
                                month={leftMonth}
                                onMonthChange={setLeftMonth}
                                numberOfMonths={1}
                                initialFocus
                            />
                        </div>
                        <div>
                            <CalendarComponent
                                mode="range"
                                selected={{ from: dateFrom, to: dateTo }}
                                onSelect={handleSelect}
                                month={rightMonth}
                                onMonthChange={setRightMonth}
                                numberOfMonths={1}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusFilter
// ─────────────────────────────────────────────────────────────────────────────
/**
 * A three-option status picker rendered as a compact pill popover.
 * Options: All (default) | Active | Inactive
 *
 * `value`    — one of: '' (all) | 'active' | 'inactive'
 * `onChange` — called with the new value string
 *
 * Matches the visual style of SingleSelectPopover so it sits consistently
 * alongside the other filter pills in the toolbar.
 *
 * Usage:
 *   <StatusFilter value={status} onChange={setStatus} />
 */
const STATUS_OPTIONS = [
    { value: '', label: 'All', dot: 'bg-slate-400', style: 'text-slate-600 dark:text-slate-300' },
    { value: 'active', label: 'Active', dot: 'bg-emerald-500', style: 'text-emerald-700 dark:text-emerald-400' },
    { value: 'inactive', label: 'Inactive', dot: 'bg-[#d85e39]', style: 'text-[#d85e39] dark:text-orange-400' },
] as const;

type StatusValue = '' | 'active' | 'inactive';

interface StatusFilterProps {
    value: StatusValue;
    onChange: (value: StatusValue) => void;
    className?: string;
}

export function StatusFilter({ value, onChange, className }: StatusFilterProps) {
    const [open, setOpen] = useState(false);

    const current = STATUS_OPTIONS.find(o => o.value === value) ?? STATUS_OPTIONS[0];
    const isActive = value !== '';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium',
                        'border transition-all duration-150 whitespace-nowrap',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4791]/40',
                        isActive
                            ? 'border-[#1d4791]/50 bg-[#1d4791]/8 dark:bg-[#1d4791]/20 text-[#1d4791] dark:text-blue-300 ring-1 ring-[#1d4791]/20'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 hover:border-[#1d4791]/40 hover:text-[#1d4791] dark:hover:text-blue-300',
                        className,
                    )}
                >
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', current.dot)} />
                    <span>{current.label}</span>
                    <ChevronDown className={cn(
                        'h-3.5 w-3.5 flex-shrink-0 opacity-50 transition-transform duration-150',
                        open && 'rotate-180',
                    )} />
                </button>
            </PopoverTrigger>

            <PopoverContent
                className="w-[160px] p-0 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/40"
                align="start"
                sideOffset={6}
            >
                {/* Popover header */}
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Status
                    </p>
                </div>

                {/* Options */}
                <div className="p-1.5 flex flex-col gap-0.5">
                    {STATUS_OPTIONS.map(option => {
                        const isSelected = value === option.value;
                        return (
                            <button
                                key={option.value}
                                onClick={() => { onChange(option.value); setOpen(false); }}
                                className={cn(
                                    'flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-sm text-left transition-all duration-100',
                                    isSelected
                                        ? 'bg-[#1d4791]/10 dark:bg-[#1d4791]/20 text-[#1d4791] dark:text-blue-300 font-medium'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60',
                                )}
                            >
                                <span className={cn('w-2 h-2 rounded-full flex-shrink-0', option.dot)} />
                                <span className="flex-1">{option.label}</span>
                                {isSelected && (
                                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-[#1d4791] dark:text-blue-300" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
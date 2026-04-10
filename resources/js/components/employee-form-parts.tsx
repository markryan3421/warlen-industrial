/**
 * employee-form-parts.tsx
 *
 * Shared sub-components used by both create.tsx and update.tsx.
 * Keeps the two form pages DRY while applying the project design system.
 *
 * Exported:
 *   FORM_KEYFRAMES   — animation CSS string to inject once via <style>
 *   FormCard         — full-page card wrapper with entrance animation
 *   FormSection      — navy-header section block (mirrors CustomTable header)
 *   FieldGroup       — label + input + error slot
 *   PhoneInput       — +63 prefix input
 *   SearchDropdown   — searchable single-select dropdown (replaces the custom ones)
 *   StatusDisplay    — read-only auto-computed status badge
 *   PaySelect        — styled pay frequency <select>
 */

import { Search, ChevronDown, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';

// ─── Keyframes ────────────────────────────────────────────────────────────────
export const FORM_KEYFRAMES = `
@keyframes formFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0);    }
}
@keyframes formSlideRight {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0);     }
}
@keyframes dropIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
}
`;

// ─── FormCard ─────────────────────────────────────────────────────────────────
/**
 * The outer card that wraps the entire form.
 * Matches the rounded-2xl + border + shadow system of CustomTable.
 */
export function FormCard({
    children,
    delay = 0,
}: {
    children: React.ReactNode;
    delay?: number;
}) {
    return (
        <div
            className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
            style={{ animation: `formFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` }}
        >
            {children}
        </div>
    );
}

// ─── FormSection ──────────────────────────────────────────────────────────────
/**
 * A navy-header section block inside the form card.
 * Uses the same bg-[#1d4791] header pattern as CustomTable.
 */
export function FormSection({
    icon: Icon,
    title,
    children,
    delay = 0,
}: {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
    delay?: number;
}) {
    return (
        <div
            className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
            style={{ animation: `formFadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` }}
        >
            {/* Navy header — identical to CustomTable header */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-[#1d4791]">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-white" strokeWidth={1.75} />
                </div>
                <p className="text-[12px] font-bold text-white uppercase tracking-widest">{title}</p>
            </div>
            {/* Fields */}
            <div className="p-5 space-y-4">
                {children}
            </div>
        </div>
    );
}

// ─── FieldGroup ───────────────────────────────────────────────────────────────
/**
 * Label + input slot + InputError.
 * `required` renders the red asterisk after the label.
 */
export function FieldGroup({
    label,
    htmlFor,
    required,
    error,
    hint,
    children,
}: {
    label: string;
    htmlFor?: string;
    required?: boolean;
    error?: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label
                htmlFor={htmlFor}
                className="text-[12px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
            >
                {label}
                {required && <span className="text-[#d85e39] ml-1">*</span>}
            </Label>
            {children}
            {hint && !error && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>
            )}
            {error && <InputError message={error} />}
        </div>
    );
}

// ─── PhoneInput ───────────────────────────────────────────────────────────────
/** +63 prefix phone input */
export function PhoneInput({
    id,
    value,
    onChange,
    placeholder = 'XXX XXX XXXX',
}: {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
}) {
    return (
        <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-medium flex-shrink-0">
                +63
            </span>
            <Input
                id={id}
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                maxLength={10}
                className="rounded-l-none border-slate-200 dark:border-slate-700 focus-visible:ring-[#1d4791]/30 focus-visible:border-[#1d4791]/50"
            />
        </div>
    );
}

// ─── SearchDropdown ───────────────────────────────────────────────────────────
/**
 * Searchable single-select dropdown.
 * Replaces the raw custom dropdowns in the original create/update forms.
 * Uses the same navy hover/selected colours as the filter popovers.
 */
interface DropdownOption {
    id: number;
    label: string;
}

interface SearchDropdownProps {
    id?: string;
    placeholder?: string;
    options: DropdownOption[];
    selectedLabel: string;
    searchValue: string;
    isOpen: boolean;
    onToggle: () => void;
    onSearch: (v: string) => void;
    onSelect: (id: string, label: string) => void;
    disabled?: boolean;
    disabledMessage?: string;
}

export function SearchDropdown({
    id,
    placeholder = 'Select…',
    options,
    selectedLabel,
    searchValue,
    isOpen,
    onToggle,
    onSearch,
    onSelect,
    disabled,
    disabledMessage,
}: SearchDropdownProps) {
    const hasSelection = !!selectedLabel;

    return (
        <div className="relative" id={id}>
            {/* Trigger */}
            <button
                type="button"
                onClick={disabled ? undefined : onToggle}
                className={cn(
                    'w-full flex items-center justify-between h-10 px-3 rounded-lg border text-sm transition-all duration-150',
                    disabled
                        ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        : hasSelection
                            ? 'border-[#1d4791]/50 bg-[#1d4791]/5 dark:bg-[#1d4791]/15 text-[#1d4791] dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-[#1d4791]/40',
                )}
            >
                <span className="truncate font-medium">
                    {hasSelection ? selectedLabel : placeholder}
                </span>
                <ChevronDown className={cn(
                    'h-4 w-4 flex-shrink-0 opacity-50 transition-transform duration-150',
                    isOpen && 'rotate-180',
                )} />
            </button>

            {/* Dropdown panel */}
            {isOpen && !disabled && (
                <div
                    className="absolute z-20 w-full mt-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/40 overflow-hidden"
                    style={{ animation: 'dropIn 0.15s cubic-bezier(0.16,1,0.3,1) both' }}
                >
                    {/* Search */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            <Input
                                value={searchValue}
                                onChange={e => onSearch(e.target.value)}
                                placeholder="Search…"
                                className="pl-8 h-8 text-xs border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-visible:ring-[#1d4791]/30"
                                autoFocus
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="max-h-52 overflow-y-auto p-1.5">
                        {options.length === 0 ? (
                            <p className="text-center py-5 text-xs text-slate-400 dark:text-slate-500">No options found</p>
                        ) : (
                            <div className="flex flex-col gap-0.5">
                                {options.map(opt => {
                                    const isSelected = opt.label === selectedLabel;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => onSelect(opt.id.toString(), opt.label)}
                                            className={cn(
                                                'flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-sm text-left transition-all duration-100',
                                                isSelected
                                                    ? 'bg-[#1d4791]/10 dark:bg-[#1d4791]/20 text-[#1d4791] dark:text-blue-300 font-semibold'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60',
                                            )}
                                        >
                                            <span className="truncate">{opt.label}</span>
                                            {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0 text-[#1d4791] dark:text-blue-300" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {disabledMessage && disabled && (
                <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-1">{disabledMessage}</p>
            )}
        </div>
    );
}

// ─── StatusDisplay ────────────────────────────────────────────────────────────
/**
 * Read-only auto-computed status badge.
 * Replaces the plain readonly Input in the originals.
 */
export function StatusDisplay({ status }: { status: string }) {
    const isActive = status?.toLowerCase() === 'active';
    const isEmpty = !status;

    return (
        <div className={cn(
            'flex items-center h-10 px-3 rounded-lg border text-sm font-medium',
            isEmpty
                ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                : isActive
                    ? 'border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-[#d85e39]/20 bg-[#d85e39]/5 dark:bg-[#d85e39]/10',
        )}>
            {isEmpty ? (
                <span className="text-slate-400 dark:text-slate-500 italic text-xs">
                    Auto-computed from contract dates
                </span>
            ) : (
                <span className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-[#d85e39]'}`} />
                    <span className={isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#d85e39] dark:text-orange-400'}>
                        {status}
                    </span>
                </span>
            )}
        </div>
    );
}

// ─── PaySelect ────────────────────────────────────────────────────────────────
/** Styled pay frequency select — replaces raw <select> */
export function PaySelect({
    id,
    value,
    onChange,
}: {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
    return (
        <select
            id={id}
            value={value}
            onChange={onChange}
            className={cn(
                'w-full h-10 px-3 rounded-lg border text-sm transition-colors appearance-none',
                'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200',
                value
                    ? 'border-[#1d4791]/50 bg-[#1d4791]/5 dark:bg-[#1d4791]/15 text-[#1d4791] dark:text-blue-300 font-medium'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400',
                'focus:outline-none focus:ring-1 focus:ring-[#1d4791]/30 focus:border-[#1d4791]/50',
            )}
        >
            <option value="">Select pay frequency…</option>
            <option value="weekender">Weekender</option>
            <option value="monthly">Monthly</option>
            <option value="semi_monthly">Semi-Monthly</option>
        </select>
    );
}
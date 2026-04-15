// components/custom-table.tsx
import * as LucidIcons from "lucide-react";
import { useRoute } from "ziggy-js";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

// ─── Types ──────────────────────────────────────────────────────────────
interface TableColumn {
    label: string;
    key: string;
    isBadge?: boolean;
    render?: (row: any) => React.ReactNode;
    isImage?: boolean;
    isAction?: boolean;
    className?: string;
    isDate?: boolean;
}

interface ActionConfig {
    label: string;
    icon: keyof typeof LucidIcons;
    route: string;
    className?: string;
}

interface TableRow {
    [key: string]: any;
    id?: string | number;
}

interface CustomTableProps {
    columns: TableColumn[];
    actions: ActionConfig[];
    data: TableRow[];
    from: number;
    to?: number;
    total?: number;
    filteredCount?: number;
    totalCount?: number;
    searchTerm?: string;
    onDelete: (row: TableRow) => void;
    onView: (row: TableRow) => void;
    onEdit: (row: TableRow) => void;
    title?: string;
    toolbar?: React.ReactNode;
    filterEmptyState?: React.ReactNode;

    // NEW: bulk selection props
    selectable?: boolean;
    selectedIds?: (string | number)[];
    onSelectChange?: (ids: (string | number)[]) => void;
    selectAll?: boolean;
    onRestore?: (row: TableRow) => void;
}

// ─── Helpers (unchanged) ────────────────────────────────────────────────
function formatCellValue(col: TableColumn, row: TableRow): string {
    const val = row[col.key];
    if (val === null || val === undefined) return "—";

    const dateTimeKeys = ["time_in", "time_out"];
    const dateOnlyKeys = ["created_at", "period_start", "period_end", "date"];

    if (dateTimeKeys.includes(col.key)) {
        return new Date(val).toLocaleTimeString("en-US", {
            hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC",
        });
    }
    if (dateOnlyKeys.includes(col.key)) {
        return new Date(val).toLocaleDateString("en-US", {
            day: "2-digit", month: "short", year: "numeric",
        });
    }
    return String(val);
}

function IndexBadge({ value }: { value: number }) {
    return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d4791]/10 dark:bg-[#1d4791]/25 text-[#1d4791] dark:text-blue-300 text-[11px] font-black tabular-nums">
            {value}
        </span>
    );
}

function CellValue({ col, row }: { col: TableColumn; row: TableRow }) {
    if (col.render) {
        const rendered = col.render(row);
        if (col.isBadge) {
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#1d4791]/10 dark:bg-[#1d4791]/20 text-[#1d4791] dark:text-blue-300 border border-[#1d4791]/15 dark:border-[#1d4791]/30 whitespace-nowrap">
                    {rendered}
                </span>
            );
        }
        return <>{rendered}</>;
    }

    if (col.isImage) {
        return (
            <div className="flex justify-center">
                <img
                    src={row[col.key] as string}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 transition-all duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] hover:scale-125 hover:shadow-lg hover:z-10 relative"
                />
            </div>
        );
    }

    if (col.isBadge) {
        const rendered = col.render ? col.render(row) : formatCellValue(col, row);
        return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#1d4791]/10 dark:bg-[#1d4791]/20 text-[#1d4791] dark:text-blue-300 border border-[#1d4791]/15 dark:border-[#1d4791]/30 whitespace-nowrap">
                {rendered}
            </span>
        );
    }

    if (col.isDate) {
        return (
            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {new Date(row[col.key]).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                })}
            </span>
        );
    }

    return (
        <span className="block truncate max-w-[220px]">
            {formatCellValue(col, row)}
        </span>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#1d4791]/8 dark:bg-[#1d4791]/15 border border-[#1d4791]/12 dark:border-[#1d4791]/25 flex items-center justify-center mb-4">
                <LucidIcons.Inbox className="w-6 h-6 text-[#1d4791]/40 dark:text-blue-400/40" strokeWidth={1.5} />
            </div>
            <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                No records found
            </p>
            <p className="text-[12px] text-slate-400 dark:text-slate-500">
                There is no data to display right now.
            </p>
        </div>
    );
}

function ActionDropdown({
    row,
    actions,
    onDelete,
    onView,
    onEdit,
    onRestore,
    route,
}: {
    row: TableRow;
    actions: ActionConfig[];
    onDelete: (r: TableRow) => void;
    onView: (r: TableRow) => void;
    onEdit: (r: TableRow) => void;
    onRestore?: (r: TableRow) => void;
    route: ReturnType<typeof useRoute>;
}) {
    const nonDestructive = actions.filter(a => a.label !== "Delete");
    const destructive = actions.filter(a => a.label === "Delete");

    const handleAction = (action: ActionConfig) => {
        if (action.label === "Delete") {
            if (row.id !== undefined && row.id !== null) {
                onDelete(row);
            } else {
                console.error('Cannot delete: row has no id', row);
            }
        } else if (action.label === "View") {
            onView(row);
        } else if (action.label === "Edit") {
            onEdit(row);
        } else if (action.label === "Restore") {
            onRestore?.(row);
        } else if (action.route) {
            if (row.id !== undefined && row.id !== null) {
                window.location.href = route(action.route, row.id);
            } else {
                console.error('Cannot navigate: row has no id', row);
            }
        }
        if (action.label === 'Restore') {
            onRestore?.(row);
        }
    };

    return (
        <div className="flex justify-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-[#1d4791]/8 dark:hover:bg-[#1d4791]/20 hover:text-[#1d4791] dark:hover:text-blue-300 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4791]/40">
                        <span className="sr-only">Open menu</span>
                        <LucidIcons.EllipsisVertical className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    className="min-w-[160px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-slate-950/40 p-1"
                >
                    {nonDestructive.map((action, i) => {
                        const Icon = LucidIcons[action.icon] as React.ElementType;
                        return (
                            <DropdownMenuItem
                                key={i}
                                onClick={() => handleAction(action)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-[#1d4791]/8 dark:hover:bg-[#1d4791]/20 hover:text-[#1d4791] dark:hover:text-blue-300 cursor-pointer transition-colors focus:bg-[#1d4791]/8 focus:text-[#1d4791]"
                            >
                                <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
                                {action.label}
                            </DropdownMenuItem>
                        );
                    })}

                    {destructive.length > 0 && nonDestructive.length > 0 && (
                        <DropdownMenuSeparator className="my-1 border-slate-100 dark:border-slate-800" />
                    )}
                    {destructive.map((action, i) => {
                        const Icon = LucidIcons[action.icon] as React.ElementType;
                        return (
                            <DropdownMenuItem
                                key={i}
                                onClick={() => handleAction(action)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#d85e39] dark:text-orange-400 hover:bg-[#d85e39]/8 dark:hover:bg-[#d85e39]/15 cursor-pointer transition-colors focus:bg-[#d85e39]/8 focus:text-[#d85e39]"
                            >
                                <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
                                {action.label}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────
export const CustomTable = ({
    columns,
    actions,
    data,
    from,
    to,
    total,
    filteredCount,
    totalCount,
    searchTerm,
    onDelete,
    onView,
    onEdit,
    title,
    toolbar,
    filterEmptyState,
    selectable = false,
    selectedIds = [],
    onSelectChange,
    selectAll = false,
    onRestore,
}: CustomTableProps) => {
    const route = useRoute();
    const dataColumns = columns.filter(col => !col.isAction);
    const hasActions = columns.some(col => col.isAction);
    const actionProps = { actions, onDelete, onView, onEdit, onRestore, route };

    const handleSelectAll = (checked: boolean) => {
        if (!onSelectChange) return;
        if (checked) {
            onSelectChange(data.map(row => row.id).filter(id => id != null));
        } else {
            onSelectChange([]);
        }
    };

    const handleSelectRow = (row: TableRow, checked: boolean) => {
        if (!onSelectChange) return;
        const id = row.id;
        if (id == null) return;
        const newSelected = checked
            ? [...selectedIds, id]
            : selectedIds.filter(i => i !== id);
        onSelectChange(newSelected);
    };

    const getHeaderRecordDisplayText = () => { /* same as before */ };
    const getFooterRecordDisplayText = () => { /* same as before */ };

    if (!data || data.length === 0) {
        return (
            <div className="w-full font-sans">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 bg-[#1d4791] dark:bg-[#1d4791]">
                        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                            <LucidIcons.Table2 className="w-4 h-4 text-white" strokeWidth={1.75} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-white leading-tight truncate">
                                {title ?? "Data Table"}
                            </p>
                            <p className="text-[11px] text-blue-200/60 mt-0.5">
                                0 records
                            </p>
                        </div>
                    </div>
                    {toolbar && (
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                            {toolbar}
                        </div>
                    )}
                    {filterEmptyState ?? <EmptyState />}
                </div>
            </div>
        );
    }

    // ── DESKTOP VIEW (≥1024px) with selection column ────────────────────
    return (
        <div className="w-full font-sans">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center gap-3 px-5 py-4 bg-[#1d4791] dark:bg-[#1d4791]">
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                        <LucidIcons.Table2 className="w-4 h-4 text-white" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-white leading-tight truncate">
                            {title ?? "Data Table"}
                        </p>
                        <p className="text-[11px] text-blue-200/60 mt-0.5">
                            {getHeaderRecordDisplayText()}
                        </p>
                    </div>
                </div>

                {toolbar && (
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                        {toolbar}
                    </div>
                )}

                {/* MOBILE (<768px) - no selection for simplicity, can be added later */}
                <div className="block md:hidden">
                    {/* ... same as before, no checkboxes ... */}
                </div>

                {/* TABLET (768px–1023px) - also no checkboxes to keep cards clean */}
                <div className="hidden md:block lg:hidden">
                    {/* ... same as before ... */}
                </div>

                {/* DESKTOP (≥1024px) - full table with selection */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full border-collapse text-[13px] text-slate-700 dark:text-slate-300">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/80">
                                {selectable && (
                                    <th className="w-10 px-2 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="rounded border-slate-300 dark:border-slate-600"
                                        />
                                    </th>
                                )}
                                <th className="w-14 px-5 py-3 text-center text-[10px] font-black tracking-widest uppercase text-[#1d4791] dark:text-blue-400 whitespace-nowrap">
                                    #
                                </th>
                                {columns.map(col => (
                                    <th
                                        key={col.key}
                                        className={`px-4 py-3 text-left text-[10px] font-black tracking-widest uppercase whitespace-nowrap text-slate-500 dark:text-slate-400 ${col.className ?? ""}`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr
                                    key={row.id || index}
                                    className="group border-b border-slate-100 dark:border-slate-800 last:border-0 bg-white dark:bg-slate-900 hover:bg-[#1d4791]/[0.03] dark:hover:bg-[#1d4791]/10 transition-colors duration-150"
                                >
                                    {selectable && (
                                        <td className="px-2 py-3.5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(row.id)}
                                                onChange={(e) => handleSelectRow(row, e.target.checked)}
                                                className="rounded border-slate-300 dark:border-slate-600"
                                            />
                                        </td>
                                    )}
                                    <td className="px-5 py-3.5 text-center align-middle">
                                        <IndexBadge value={from + index} />
                                    </td>
                                    {columns.map(col => (
                                        <td
                                            key={col.key}
                                            className={`px-4 py-3.5 align-middle text-left text-slate-700 dark:text-slate-300 overflow-hidden ${col.className ?? ""}`}
                                        >
                                            {col.isAction ? (
                                                <ActionDropdown {...actionProps} row={row} />
                                            ) : (
                                                <CellValue col={col} row={row} />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d85e39]" />
                        <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                            {getFooterRecordDisplayText()}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                        <span>Row {from} – {to || from + data.length - 1}</span>
                        {totalCount !== undefined && totalCount > 0 && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                                Total: {totalCount.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
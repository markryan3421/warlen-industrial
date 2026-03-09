import * as LucidIcons from "lucide-react";
import { useRoute } from "ziggy-js";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

interface TableColumn {
    label: string;
    key: string;
    isBadge?: boolean;
    render?: (row: any) => React.ReactNode;
    isImage?: boolean;
    isAction?: boolean;
    className?: string;
}

interface ActionConfig {
    label: string;
    icon: keyof typeof LucidIcons;
    route: string;
    className?: string;
}

interface TableRow {
    [key: string]: any;
}

interface CustomTableProps {
    columns: TableColumn[];
    actions: ActionConfig[];
    data: TableRow[];
    from: number;
    onDelete: (route: string) => void;
    onView: (row: TableRow) => void;
    onEdit: (row: TableRow) => void;
    // isModal?: boolean;
}

// ── Date/time formatter — shared by all views ──────────────────────────────────
function formatCellValue(col: TableColumn, row: TableRow): string {
    const val = row[col.key];

    if (val === null || val === undefined) return "—";

    const dateTimeKeys = ["time_in", "time_out"];
    const dateOnlyKeys = ["created_at", "period_start", "period_end", "date"];

    if (dateTimeKeys.includes(col.key)) {
        return new Date(val).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZone: "UTC",
        });
    }

    if (dateOnlyKeys.includes(col.key)) {
        return new Date(val).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    return String(val);
}

export const CustomTable = ({
    columns,
    actions,
    data,
    from,
    onDelete,
    onView,
    onEdit,
    // isModal,
}: CustomTableProps) => {
    const route = useRoute();

    // ── Action dropdown — reused in all views ──────────────────────────────────
    const renderActionButtons = (row: TableRow) => (
        <div className="flex justify-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <LucidIcons.EllipsisVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {actions.map((action, index) => {
                        const IconComponent = LucidIcons[action.icon] as React.ElementType;
                        const isDelete = action.label === "Delete";
                        return (
                            <DropdownMenuItem
                                key={index}
                                className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors
                                    ${isDelete
                                        ? "text-red-600 focus:text-red-600"
                                        : "text-white-700 hover:text-white-900"
                                    }`}
                                onClick={() => {
                                    if (isDelete) {
                                        onDelete(route(action.route, row.id));
                                    } else if (action.label === "View") {
                                        onView?.(row);
                                    } else if (action.label === "Edit") {
                                        onEdit?.(row);
                                    } else {
                                        window.location.href = route(action.route, row.id);
                                    }
                                }}
                            >
                                <IconComponent strokeWidth={1} className="h-4 w-4" />
                                <span>{action.label}</span>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );

    // ── Data columns only (excludes the action column) ─────────────────────────
    const dataColumns = columns.filter((col) => !col.isAction);
    const hasActions = columns.some((col) => col.isAction);

    // ── Empty state — shared by all views ──────────────────────────────────────
    const emptyState = (
        <div className="py-14 px-6 text-center">
            <p className="text-[15px] font-bold text-stone-800 dark:text-stone-100 mb-1">
                No records found
            </p>
            <p className="text-[13px] text-stone-400 dark:text-stone-500">
                There is no data to display right now.
            </p>
        </div>
    );

    return (
        <div className="w-full font-sans">
            <div className="mx-4 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0c1529] shadow-sm dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]">

                {/* ── Caption bar ───────────────────────────────────────────── */}
                <div className="flex items-center gap-3 px-6 py-[18px] border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#0a1628]">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-blue-600 dark:bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950" />
                    <span className="text-[11px] font-semibold tracking-widest uppercase text-stone-400 dark:text-stone-500">
                        Information Table
                    </span>
                </div>

                {/* MOBILE VIEW  — below md (< 768px)
                Each row is a stacked card with label: value pairs. */}
                <div className="block md:hidden">
                    {data.length === 0 ? (
                        emptyState
                    ) : (
                        <div className="divide-y divide-stone-100 dark:divide-stone-800/70">
                            {data.map((row, index) => (
                                <div
                                    key={index}
                                    className="px-4 py-4 odd:bg-white even:bg-stone-50/60 dark:odd:bg-[#0c1529] dark:even:bg-[#0e1a30] animate-in fade-in slide-in-from-bottom-2"
                                    style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
                                >
                                    {/* Card header: row number + actions */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-[7px] bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                                            {from + index}
                                        </span>
                                        {hasActions && renderActionButtons(row)}
                                    </div>

                                    {/* Card body: label → value grid (2 columns) */}
                                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                                        {dataColumns.map((col) => (
                                            <div key={col.key} className="flex flex-col min-w-0">
                                                <dt className="text-[10px] font-bold tracking-widest uppercase text-stone-400 dark:text-stone-500 truncate">
                                                    {col.label}
                                                </dt>
                                                <dd className="text-[13px] text-stone-700 dark:text-stone-300 mt-0.5 truncate">
                                                    {col.isImage ? (
                                                        <img
                                                            src={row[col.key] as string}
                                                            alt="Image"
                                                            className="w-10 h-10 rounded-lg object-cover border border-stone-200 dark:border-stone-700"
                                                        />
                                                    ) : (
                                                        formatCellValue(col, row)
                                                    )}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    TABLET VIEW  — md to lg (768px–1023px)
                    Two-column card layout: more breathing room than mobile,
                    less cramped than forcing a full table on a narrow screen.
                ══════════════════════════════════════════════════════════════ */}
                <div className="hidden md:block lg:hidden">
                    {data.length === 0 ? (
                        emptyState
                    ) : (
                        <div className="p-4 grid grid-cols-2 gap-3">
                            {data.map((row, index) => (
                                <div
                                    key={index}
                                    className="rounded-xl border border-stone-200 dark:border-stone-700/60 bg-white dark:bg-[#0d1630] p-4 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
                                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                                >
                                    {/* Card header: row number + actions */}
                                    <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-stone-100 dark:border-stone-800">
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-[7px] bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                                            {from + index}
                                        </span>
                                        {hasActions && renderActionButtons(row)}
                                    </div>

                                    {/* Card body: label → value list */}
                                    <dl className="flex flex-col gap-2">
                                        {dataColumns.map((col) => (
                                            <div key={col.key} className="flex items-start justify-between gap-2 min-w-0">
                                                <dt className="text-[10px] font-bold tracking-widest uppercase text-stone-400 dark:text-stone-500 shrink-0 pt-0.5">
                                                    {col.label}
                                                </dt>
                                                <dd className="text-[12.5px] font-medium text-stone-700 dark:text-stone-300 text-right truncate">
                                                    {col.isImage ? (
                                                        <img
                                                            src={row[col.key] as string}
                                                            alt="Image"
                                                            className="w-10 h-10 rounded-lg object-cover border border-stone-200 dark:border-stone-700 ml-auto"
                                                        />
                                                    ) : (
                                                        formatCellValue(col, row)
                                                    )}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    DESKTOP VIEW  — lg and above (≥ 1024px)
                    Full table layout.
                ══════════════════════════════════════════════════════════════ */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full border-collapse text-[13.5px] text-stone-800 dark:text-stone-200">

                        {/* Head */}
                        <thead className="bg-stone-900 dark:bg-[#080f1e]">
                            <tr>
                                <th className="w-12 px-6 py-3.5 text-center text-[10px] font-bold tracking-[0.12em] uppercase whitespace-nowrap text-blue-500 dark:text-blue-400 border-none">
                                    #
                                </th>
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className={`px-[18px] py-3.5 last:pr-6 text-center text-[10px] font-bold tracking-[0.1em] uppercase whitespace-nowrap text-stone-100 dark:text-stone-200 border-none ${col.className ?? ""}`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800/70">
                            {data.length > 0 ? (
                                data.map((row, index) => (
                                    <tr
                                        key={index}
                                        className="group odd:bg-white even:bg-stone-50/60 dark:odd:bg-[#0c1529] dark:even:bg-[#0e1a30] hover:bg-blue-50/60 dark:hover:bg-[#0f1e3a] hover:translate-x-0.5 transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-2"
                                        style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
                                    >
                                        {/* Row index badge */}
                                        <td className="px-6 py-3.5 text-center align-middle border-none">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-[7px] bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                                                {from + index}
                                            </span>
                                        </td>

                                        {/* Data cells */}
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={`px-[18px] py-3.5 last:pr-6 text-center align-middle text-stone-700 dark:text-stone-300 border-none ${col.className ?? ""}`}
                                            >
                                                {col.isImage ? (
                                                    <img
                                                        src={row[col.key] as string}
                                                        alt="Image"
                                                        className="w-[72px] h-[72px] mx-auto rounded-xl object-cover border-2 border-stone-200 dark:border-stone-700 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] hover:scale-110 hover:-rotate-1 hover:shadow-xl"
                                                    />
                                                ) : col.isAction ? (
                                                    renderActionButtons(row)
                                                ) : col.isBadge ? (
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                        {col.render ? col.render(row) : formatCellValue(col, row)}&nbsp;{col.render(row) === 1 ? "site" : "sites"}
                                                    </span>
                                                ) : (
                                                    <span>{formatCellValue(col, row)}</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 1} className="border-none">
                                        {emptyState}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Footer ────────────────────────────────────────────────── */}
                {data.length > 0 && (
                    <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#0a1628]">
                        <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
                            Showing{" "}
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                {data.length}
                            </span>{" "}
                            record{data.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
};
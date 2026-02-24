// import { Link } from "@inertiajs/react";
// import { Eye, Pencil, Trash } from "lucide-react";
import * as LucidIcons from "lucide-react";
import { MoreHorizontalIcon } from "lucide-react";
import { useRoute } from "ziggy-js";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    // DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";


interface TableColumn {
    label: string;
    key: string;
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
    // Dynamic keys based on the columns
    // Could be string, num, etc.
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
    isModal?: boolean;
}

export const CustomTable = ({ columns, actions, data, from, onDelete, onView, onEdit, isModal }: CustomTableProps) => {
    const route = useRoute();
    // console.log(columns);
    // console.log('Data:', data);

    const renderActionButtons = (row: TableRow) => {
        return (
            <div className="flex justify-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[180px]">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>

                        {actions.map((action, index) => {
                            const IconComponent = LucidIcons[action.icon] as React.ElementType;
                            const isDelete = action.label === 'Delete';
                            // const isLastAction = index === actions.length - 1;
                            // const hasDeleteAfter = actions.slice(index + 1).some(a => a.label === 'Delete');

                            return (
                                <div key={index}>
                                    <DropdownMenuItem
                                        className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors
                            ${isDelete
                                                ? 'text-red-600 focus:text-red-600'
                                                : 'text-white-700 hover:text-white-900'
                                            }`}
                                        onClick={() => {
                                            if (isDelete) {
                                                onDelete(route(action.route, row.id));
                                            } else if (action.label === 'View') {
                                                onView?.(row);
                                            } else if (action.label === 'Edit') {
                                                onEdit?.(row);
                                            } else {
                                                window.location.href = route(action.route, row.id);
                                            }
                                        }}
                                    >
                                        <IconComponent strokeWidth={1} className="h-4 w-4" />
                                        <span>{action.label}</span>
                                    </DropdownMenuItem>
                                </div>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    // Define the Product interface, representing the structure of a product object
    return (
        <div className="w-full font-sans">

            {/* ── Outer card ── */}
            <div className="mx-4 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#171512] shadow-sm dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]">

                {/* ── Caption bar ── */}
                <div className="flex items-center gap-3 px-6 py-[18px] border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#1f1c18]">
                    {/* Accent dot */}
                    <span className="w-2 h-2 rounded-full shrink-0 bg-orange-600 dark:bg-orange-500 ring-4 ring-orange-100 dark:ring-orange-950" />
                    <span className="text-[11px] font-semibold tracking-widest uppercase text-stone-400 dark:text-stone-500">
                        Manage Permissions
                    </span>
                </div>

                {/* ── Scrollable table ── */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[13.5px] text-stone-800 dark:text-stone-200">

                        {/* ── Head ── */}
                        <thead className="bg-stone-900 dark:bg-[#0e0d0b]">
                            <tr>
                                {/* Index column */}
                                <th className="w-12 px-6 py-3.5 text-center text-[10px] font-bold tracking-[0.12em] uppercase whitespace-nowrap text-orange-500 dark:text-orange-400 border-none">
                                    #
                                </th>

                                {/* Data columns */}
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

                        {/* ── Body ── */}
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800/70">
                            {data.length > 0 ? (
                                data.map((row, index) => (
                                    <tr
                                        key={index}
                                        className="group odd:bg-white even:bg-stone-50/60 dark:odd:bg-[#171512] dark:even:bg-[#1b1814] hover:bg-orange-50/60 dark:hover:bg-[#262218] hover:translate-x-0.5 transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-2"
                                        style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
                                    >
                                        {/* Row index badge */}
                                        <td className="px-6 py-3.5 text-center align-middle border-none">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-[7px] bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-[11px] font-bold">
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
                                                    /* ── Image ── */
                                                    <img
                                                        src={row[col.key] as string}
                                                        alt="Image"
                                                        className="w-[72px] h-[72px] mx-auto rounded-xl object-cover border-2 border-stone-200 dark:border-stone-700 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] hover:scale-110 hover:-rotate-1 hover:shadow-xl"
                                                    />
                                                ) : col.isAction ? (
                                                    /* ── Action buttons ── */
                                                    renderActionButtons?.(row)
                                                ) : col.key === "created_at" ? (
                                                    /* ── Date chip ── */
                                                    <span>
                                                        {new Date(row[col.key]).toLocaleDateString('en-US', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>

                                                ) : (
                                                    /* ── Default text ── */
                                                    <span>{String(row[col.key] ?? "—")}</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                /* ── Empty state ── */
                                <tr>
                                    <td colSpan={columns.length + 1} className="py-14 px-6 text-center border-none align-middle">
                                        <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center text-xl bg-stone-50 dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700">
                                            📭
                                        </div>
                                        <p className="text-[15px] font-bold text-stone-800 dark:text-stone-100 mb-1">
                                            No records found
                                        </p>
                                        <p className="text-[13px] text-stone-400 dark:text-stone-500">
                                            There is no data to display right now.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Footer ── */}
                {data.length > 0 && (
                    <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#1f1c18]">
                        <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
                            Showing{" "}
                            <span className="font-bold text-orange-600 dark:text-orange-400">
                                {data.length}
                            </span>{" "}
                            record{data.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}

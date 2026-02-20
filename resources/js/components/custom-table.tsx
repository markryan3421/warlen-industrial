import { Link } from "@inertiajs/react";
// import { Eye, Pencil, Trash } from "lucide-react";
import * as LucidIcons from "lucide-react";
import { MoreHorizontalIcon, Eye, Pencil, Trash } from "lucide-react";
import { useRoute } from "ziggy-js";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";


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
        <div className="overflow-hidden rounded-lg border shadow-sm border">
            <Table className="w-full table-auto border-collapse text-center text-sm">
                <TableHeader className='w-[100px]'>
                    <TableRow className="border-b">
                        <TableHead className="p-4 text-center text-xs font-medium uppercase tracking-wider">#</TableHead>
                        {columns.map((column) => (
                            <TableHead key={column.key} className={column.className}>{column.label}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>

                <TableBody className='divide-y'>
                    {data.length > 0 ? (
                        data.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell className="border p-4 text-center">{from + index}</TableCell>

                                {/* Loop to 'columns' JSON to match its "key" value to database column's value. Then display the data */}
                                {columns.map((col) => (
                                    <TableCell key={col.key} className={`border p-4 text-center ${col.className}`}>
                                        {col.isImage ? (
                                            <div> <img src={row[col.key]} alt="Product Image" className="h-32 w-32 rounded-lg object-cover justify-self-center" /></div>
                                        ) : col.isAction ? (
                                            renderActionButtons(row)
                                        ) : col.key === 'created_at' ? (
                                            <span>{new Date(row[col.key]).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        ) : (
                                            row[col.key]
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow className='text-center py-4 text-md font-bold'>
                            <TableCell colSpan={7} className="p-4 text-center text-red-700">
                                No data found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div >
    );
}

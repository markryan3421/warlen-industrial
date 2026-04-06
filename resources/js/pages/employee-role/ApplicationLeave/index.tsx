import AppLayout from '@/layouts/emp-layout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import ApplicationLeaveController from '@/actions/App/Http/Controllers/EmployeeRole/ApplicationLeaveController';
import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, PlusCircle, Bell, X, Search, Filter } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// ... (Echo initialization remains same) ...

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Leaves', href: '/application-leaves' },
];

interface ApplicationLeaveProps {
    applicationLeaves: any[];
    approvedCount?: number;
}

export default function Index({ applicationLeaves, approvedCount = 0 }: ApplicationLeaveProps) {
    const hasReachedLimit = approvedCount >= 5;

    // Search & filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Filtered leaves
    const filteredLeaves = useMemo(() => {
        return applicationLeaves.filter(leave => {
            const matchesSearch = leave.reason_to_leave?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                leave.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || leave.app_status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [applicationLeaves, searchTerm, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
    const paginatedLeaves = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredLeaves.slice(start, start + itemsPerPage);
    }, [filteredLeaves, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    // ... (Echo setup remains same) ...

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Application Leaves" />
            <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
                {/* Notification Toast */}
                {/* ... same as before, but with aria-live="polite" ... */}

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Application Leaves</h1>
                    {!hasReachedLimit && (
                        <Link href={ApplicationLeaveController.create()}>
                            <Button className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Create Leave Application
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Limit warning */}
                {hasReachedLimit && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-md">
                            <p className="text-sm font-medium">
                                You have reached the maximum limit of 5 approved leaves for this year.
                                You cannot create new leave applications until next year.
                            </p>
                        </div>
                    </div>
                )}

                {/* Search & Filter */}
                {applicationLeaves.length > 0 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by reason or employee..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-40">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Main content */}
                <div className="flex flex-col gap-4">
                    {paginatedLeaves.length === 0 ? (
                        <EmptyState hasReachedLimit={hasReachedLimit} />
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Leave Start</TableHead>
                                            <TableHead>Leave End</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Approved/Rejected By</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedLeaves.map((leave) => (
                                            <TableRow key={leave.id || leave.slug_app} className="hover:bg-muted/50 transition-colors">
                                                <TableCell>{leave.leave_start}</TableCell>
                                                <TableCell>{leave.leave_end}</TableCell>
                                                <TableCell>
                                                    <StatusBadge status={leave.app_status} />
                                                </TableCell>
                                                <TableCell>
                                                    {leave.app_status === 'approved' && leave.approved_by && (
                                                        <span className="text-green-600">Approved by {leave.approved_by}</span>
                                                    )}
                                                    {leave.app_status === 'rejected' && leave.rejected_by && (
                                                        <span className="text-red-600">Rejected by {leave.rejected_by}</span>
                                                    )}
                                                    {leave.app_status === 'pending' && <span className="text-muted-foreground">—</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={ApplicationLeaveController.edit(leave.slug_app)}
                                                        className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                                                    >
                                                        Edit
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile cards */}
                            <div className="grid gap-3 md:hidden">
                                {paginatedLeaves.map((leave) => (
                                    <div key={leave.id || leave.slug_app} className="rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-sm text-muted-foreground">
                                                    {leave.leave_start} → {leave.leave_end}
                                                </div>
                                                <StatusBadge status={leave.app_status} className="mt-2" />
                                            </div>
                                            <Link
                                                href={ApplicationLeaveController.edit(leave.slug_app)}
                                                className="text-primary hover:underline text-sm font-medium"
                                            >
                                                Edit
                                            </Link>
                                        </div>
                                        {(leave.app_status === 'approved' && leave.approved_by) && (
                                            <p className="text-xs text-green-600 mt-2">Approved by {leave.approved_by}</p>
                                        )}
                                        {(leave.app_status === 'rejected' && leave.rejected_by) && (
                                            <p className="text-xs text-red-600 mt-2">Rejected by {leave.rejected_by}</p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
                                                aria-disabled={currentPage === 1}
                                            />
                                        </PaginationItem>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                                                    isActive={currentPage === page}
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                                                aria-disabled={currentPage === totalPages}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

// Helper components
function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
    const variant = status === 'approved' ? 'success' : status === 'rejected' ? 'destructive' : 'warning';
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
    return (
        <Badge variant={variant} className={`capitalize ${className}`}>
            {label}
        </Badge>
    );
}

function EmptyState({ hasReachedLimit }: { hasReachedLimit: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in duration-500">
            <div className="rounded-full bg-muted p-6 mb-4">
                <CalendarDays className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No application leaves yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
                Get started by creating your first leave application.
            </p>
            {!hasReachedLimit ? (
                <Link href={ApplicationLeaveController.create()}>
                    <Button className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Create Your First Leave Application
                    </Button>
                </Link>
            ) : (
                <div className="bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-md max-w-md">
                    <p className="text-sm font-medium">Cannot create new leave applications</p>
                    <p className="text-xs mt-1">You have reached the maximum limit of 5 approved leaves for this year.</p>
                </div>
            )}
        </div>
    );
}
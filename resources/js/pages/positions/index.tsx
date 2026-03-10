import { Head, Link, router } from '@inertiajs/react';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/section-chart';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Briefcase, PlusCircle, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Positions',
        href: '/positions',
    },
];

interface Position {
    id: number;
    pos_name: string;
    basic_salary: number;
    pos_slug: string;
}

interface Props {
    positions: Position[];
}

export default function Index({ positions }: Props) {
    // Initialize state from localStorage or use defaults
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(() => {
        const saved = localStorage.getItem('positions-currentPage');
        return saved ? parseInt(saved) : 1;
    });
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const saved = localStorage.getItem('positions-itemsPerPage');
        return saved ? parseInt(saved) : 10;
    });

    // Save to localStorage whenever values change
    useEffect(() => {
        localStorage.setItem('positions-currentPage', currentPage.toString());
    }, [currentPage]);

    useEffect(() => {
        localStorage.setItem('positions-itemsPerPage', itemsPerPage.toString());
    }, [itemsPerPage]);

    const deletePosition = (slug: string) => {
        if (confirm('Are you sure you want to delete this position?')) {
            router.delete(`/positions/${slug}`);
        }
    }

    // Filter positions based on search term - only by position name
    const filteredPositions = useMemo(() => {
        if (!searchTerm.trim()) {
            return positions;
        }
        
        const term = searchTerm.toLowerCase().trim();
        return positions.filter(position => 
            position.pos_name.toLowerCase().includes(term)
        );
    }, [positions, searchTerm]);

    // Pagination logic
    const totalItems = filteredPositions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Get current page items
    const currentItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredPositions.slice(startIndex, endIndex);
    }, [filteredPositions, currentPage, itemsPerPage]);

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const clearSearch = () => {
        setSearchTerm('');
    };

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const goToFirstPage = () => goToPage(1);
    const goToLastPage = () => goToPage(totalPages);
    const goToPreviousPage = () => goToPage(currentPage - 1);
    const goToNextPage = () => goToPage(currentPage + 1);

    // Generate page numbers for pagination controls
    const getPageNumbers = () => {
        const delta = 2; 
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                range.push(i);
            }
        }

        range.forEach((i) => {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        });

        return rangeWithDots;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Positions" />
            <div className="flex justify-between items-center p-4">
                <h1 className="text-2xl font-bold">Positions</h1>
                <div className="flex items-center gap-4">
                    {/* Search Bar - Only show if there are positions */}
                    {positions.length > 0 && (
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by position name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-10 py-2 w-full"
                            />
                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}
                    <Link href="/positions/create">
                        <Button size="sm">+ Add Position</Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
                {positions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="rounded-full bg-gray-100 p-6 mb-4">
                            <Briefcase className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semib text-gray-900 mb-2">No positions yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            Get started by creating your first position. Define job titles and their corresponding basic salaries.
                        </p>
                        <Link href="/positions/create">
                            <Button className="gap-2">
                                Create Your First Position
                            </Button>
                        </Link>
                    </div>
                ) : filteredPositions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-gray-50">
                        <Search className="h-12 w-12 text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
                        <p className="text-gray-500 mb-4">
                            No positions matching "{searchTerm}" found.
                        </p>
                        <Button variant="outline" onClick={clearSearch}>
                            Clear Search
                        </Button>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-left">Position Name</TableHead>
                                    <TableHead className="text-left">Basic Salary</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentItems.map((position) => (
                                    <TableRow key={position.id}>
                                        <TableCell className="text-left font-medium">
                                            {position.pos_name}
                                        </TableCell>
                                        <TableCell className="text-left">
                                            ₱ {Number(position.basic_salary).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/positions/${position.pos_slug}/edit`}>
                                                    <Button variant="outline" size="sm">
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Button variant="destructive" size="sm" onClick={() => deletePosition(position.pos_slug)}>
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Three-column layout: left (showing text), center (show entries), right (pagination) */}
                        <div className="grid grid-cols-3 items-center mt-4">
                            {/* Left column - Showing entries text */}
                            <div className="text-sm text-gray-500">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                                
                            </div>

                            {/* Center column - Show entries dropdown */}
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-sm text-gray-500">Show</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="border rounded-md px-2 py-1 text-sm"
                                >
                                    {[5, 10, 20, 50, 100].map(value => (
                                        <option key={value} value={value}>{value}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Right column - Pagination controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goToFirstPage}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goToPreviousPage}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    {/* Page Numbers */}
                                    <div className="flex items-center gap-1">
                                        {getPageNumbers().map((page, index) => (
                                            page === '...' ? (
                                                <span key={`dots-${index}`} className="px-2 py-1 text-gray-500">...</span>
                                            ) : (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => goToPage(Number(page))}
                                                    className="min-w-[32px]"
                                                >
                                                    {page}
                                                </Button>
                                            )
                                        ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goToNextPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goToLastPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
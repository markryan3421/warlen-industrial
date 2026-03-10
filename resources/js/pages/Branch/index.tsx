import AppLayout from '@/layouts/app-layout';
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem, type BranchWithSites } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import BranchController from "@/actions/App/Http/Controllers/BranchController";
import { useState, useMemo } from 'react';
import { Building2, MoreHorizontalIcon, MapPin, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CustomToast } from '@/components/custom-toast';
import { Input } from "@/components/ui/input";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Branches',
        href: '/branches',
    },
];

interface BranchProps {
    branches: BranchWithSites[];
}

export default function Index({ branches }: BranchProps) {
    const { delete: destroy } = useForm();
    const [selectedBranch, setSelectedBranch] = useState<BranchWithSites | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
   
    const handleDelete = (slug: string) => {
        if (confirm("Are you sure you want to delete this branch?")) {
            destroy(BranchController.destroy(slug).url);
        }
    }

    const viewBranchSites = (branch: BranchWithSites) => {
        setSelectedBranch(branch);
        setIsModalOpen(true);
    };

    // Filter branches based on search term
    const filteredBranches = useMemo(() => {
        if (!searchTerm.trim()) {
            return branches;
        }
        
        const lowercaseSearch = searchTerm.toLowerCase().trim();
        return branches.filter(branch => 
            branch.branch_name.toLowerCase().includes(lowercaseSearch)
        );
    }, [branches, searchTerm]);

    // Pagination logic
    const totalItems = filteredBranches.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const paginatedBranches = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredBranches.slice(startIndex, endIndex);
    }, [filteredBranches, currentPage]);

    const clearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1); // Reset to first page when clearing search
    };

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branch" />
            <CustomToast />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 px-10">
                {/* Header with title, search, and create button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                    <h1 className="text-2xl font-bold">Branches</h1>    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        {/* Search Bar */}
                        {branches.length > 0 && (
                            <div className="relative flex-1 sm:flex-initial sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search branches..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1); // Reset to first page when searching
                                    }}
                                    className="pl-9 pr-8 w-full"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        )}
                        
                        <Link
                            href={BranchController.create()}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                        >
                            + Add Branch
                        </Link>
                    </div>
                </div>

                {branches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="rounded-full bg-gray-100 p-6 mb-4">
                            <Building2 className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semib text-gray-900 mb-2">No branches yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            Get started by creating your first branch. Branches help you organize your business locations and their associated sites.
                        </p>
                        <Link href={BranchController.create()}>
                            <Button className="gap-2">
                                Create Your First Branch
                            </Button>
                        </Link>
                    </div>
                ) : filteredBranches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-gray-50">
                        <div className="rounded-full bg-gray-100 p-4 mb-4">
                            <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No matching branches</h3>
                        <p className="text-gray-500 mb-4">
                            No branches found matching "{searchTerm}"
                        </p>
                        <Button variant="outline" onClick={clearSearch} className="gap-2">
                            <X className="h-4 w-4" />
                            Clear Search
                        </Button>
                    </div>
                ) : (
                    <>
                    <div className='border rounded-lg overflow-hidden'>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Branch Name</TableHead>
                                    <TableHead>Branch Address</TableHead>
                                    <TableHead>Number of Sites</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedBranches.map((branch) => (
                                    <TableRow key={branch.id}>
                                        <TableCell className="font-medium">{branch.branch_name}</TableCell>
                                        <TableCell>{branch.branch_address}</TableCell>
                                        <TableCell>
                                            {/* Make the sites badge clickable */}
                                            <button
                                                onClick={() => viewBranchSites(branch)}
                                                className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            >
                                                {branch.sites?.length || 0} sites
                                            </button>
                                        </TableCell>
                                        <TableCell className="space-x-2"> 
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8">
                                                        <MoreHorizontalIcon />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>
                                                        <Link href={BranchController.edit(branch.branch_slug)}>Edit</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className = 'p-0'>
                                                        <Link onClick={() => handleDelete(branch.branch_slug)} className='px-2 py-1.5 rounded-sm bg-red-50 text-red-500 w-full h-full hover:bg-red-100'>Delete</Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>

                        {/* Pagination Controls - Moved below the table */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} branches
                                </div>
                                
                                <div className="flex items-center space-x-2 order-1 sm:order-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => goToPage(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronsLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    
                                    <div className="flex items-center space-x-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            
                                            return (
                                                <Button
                                                    key={i}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="icon"
                                                    onClick={() => goToPage(pageNum)}
                                                    className="w-9 h-9"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => goToPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronsRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                    </>
                )}

                {/* Modal for displaying branch sites */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[400px] sm:max-h-[300px] w-[400px] h-[300px] p-0">
                        <DialogHeader className="px-6 pt-6">
                            <DialogTitle>{selectedBranch?.branch_name} sites</DialogTitle>
                            <DialogDescription className='-mt-2 text-xs'>
                                List of all sites belonging to this branch.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="h-[200px] px-6 -mt-7">
                        {selectedBranch?.sites && selectedBranch.sites.length > 0 ? (
                            <div className="space-y-2 border-2 rounded-lg h-full overflow-y-auto">
                                {selectedBranch.sites.map((site) => (
                                    <div 
                                        key={site.id} 
                                        className="flex items-center gap-1 px-2 space-t-1 py-1 transition-colors"
                                    >
                                        <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                        <span className="text-sm">{site.site_name}</span>
                                    </div>
                                ))}
                            </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                                        <MapPin className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-muted-foreground font-medium mb-1">No sites found</p>
                                    <p className="text-sm text-gray-500">
                                        This branch doesn't have any sites assigned yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
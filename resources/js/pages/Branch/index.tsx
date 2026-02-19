import AppLayout from '@/layouts/app-layout';
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem, type BranchWithSites } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import BranchController from "@/actions/App/Http/Controllers/BranchController";
import { useState } from 'react';

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

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this branch?")) {
            destroy(BranchController.destroy(id).url);
        }
    }

    const viewBranchSites = (branch: BranchWithSites) => {
        setSelectedBranch(branch);
        setIsModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branch" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link 
                    href={BranchController.create()} 
                    className="mb-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 w-fit"
                >
                    Create Branch
                </Link>
                
                <Table>
                    <TableCaption>A list of your Branches.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Branch Name</TableHead>
                            <TableHead>Branch Address</TableHead>
                            <TableHead>Number of Sites</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {branches.map((branch) => (
                            <TableRow key={branch.id}>
                                <TableCell className="font-medium">{branch.branch_name}</TableCell>
                                <TableCell>{branch.branch_address}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                        {branch.sites?.length || 0} sites
                                    </span>
                                </TableCell>
                                <TableCell className="space-x-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => viewBranchSites(branch)}
                                    >
                                        View Sites
                                    </Button>
                                    <Link 
                                        href={BranchController.edit(branch.id)}
                                        className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                                    >
                                        Edit
                                    </Link>
                                    <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => handleDelete(branch.id)}
                                    >
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Modal for displaying branch sites */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                Sites under {selectedBranch?.branch_name || 'Branch'}
                            </DialogTitle>
                            <DialogDescription>
                                List of all sites belonging to this branch.
                                {selectedBranch?.sites?.length === 0 && (
                                    <span className="block mt-1 text-amber-600">
                                        This branch has no sites assigned yet.
                                    </span>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="mt-4 max-h-[400px] overflow-y-auto">
                            {selectedBranch?.sites && selectedBranch.sites.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Site Name</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedBranch.sites.map((site) => (
                                            <TableRow key={site.id}>
                                                <TableCell className="font-medium">{site.site_name}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <svg 
                                        className="h-12 w-12 text-gray-400 mb-4" 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                                        />
                                    </svg>
                                    <p className="text-muted-foreground">
                                        No sites found for this branch.
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
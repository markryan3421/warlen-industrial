import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, MapPin } from 'lucide-react';
import { useState } from 'react';
import BranchController from "@/actions/App/Http/Controllers/BranchController";
import { CustomToast } from '@/components/custom-toast';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type BranchWithSites } from '@/types';

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

    const handleDelete = (slug: string) => {
        if (confirm("Are you sure you want to delete this branch?")) {
            destroy(BranchController.destroy(slug).url);
        }
    }

    const viewBranchSites = (branch: BranchWithSites) => {
        setSelectedBranch(branch);
        setIsModalOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branch" />
            <CustomToast />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Branches</h1>
                    <Link
                        href={BranchController.create()}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        + Add Branch
                    </Link>
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
                ) : (
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
                                            href={BranchController.edit(branch.branch_slug)}
                                            className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                                        >
                                            Edit
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(branch.branch_slug)}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {/* Modal for displaying branch sites */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>
                                Sites under {selectedBranch?.branch_name || 'Branch'}
                            </DialogTitle>
                            <DialogDescription>
                                List of all sites belonging to this branch.
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
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    {site.site_name}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
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

import AppLayout from '@/layouts/app-layout';
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import ContributionVersionController from "@/actions/App/Http/Controllers/ContributionVersionController";
import { useState } from 'react';
import { Calculator, PlusCircle, Percent } from 'lucide-react';

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
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contributions',
        href: '/contributions',
    },
];

interface ContributionBracket {
    id: number;
    salary_from: number;
    salary_to: number;
    employee_share: number;
    employer_share: number;
}

interface ContributionVersion {
    id: number;
    type: 'sss' | 'philhealth' | 'pagibig';
    effective_from: string;
    effective_to: string;
    contribution_brackets: ContributionBracket[];
}

interface ContributionsProps {
    contributionVersions: ContributionVersion[];
}

export default function Index({ contributionVersions }: ContributionsProps) {
    const { delete: destroy } = useForm();
    const [selectedVersion, setSelectedVersion] = useState<ContributionVersion | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this contribution version?")) {
            destroy(ContributionVersionController.destroy(id).url);
        }
    }

    const viewContributionBrackets = (version: ContributionVersion) => {
        setSelectedVersion(version);
        setIsModalOpen(true);
    };

    const getContributionTypeColor = (type: string) => {
        switch(type) {
            case 'sss':
                return 'bg-blue-100 text-blue-800';
            case 'philhealth':
                return 'bg-green-100 text-green-800';
            case 'pagibig':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getContributionTypeLabel = (type: string) => {
        switch(type) {
            case 'sss':
                return 'SSS';
            case 'philhealth':
                return 'PhilHealth';
            case 'pagibig':
                return 'Pag-IBIG';
            default:
                return type;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatPercentage = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount / 100);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contributions" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Contribution Versions</h1>
                    <Link 
                        href={ContributionVersionController.create()} 
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        + Create Contribution Version
                    </Link>
                </div>
                
                {contributionVersions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="rounded-full bg-gray-100 p-6 mb-4">
                            <Calculator className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semib text-gray-900 mb-2">No contribution versions yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            Create your first contribution version to set up SSS, PhilHealth, and Pag-IBIG contribution tables with their corresponding brackets.
                        </p>
                        <Link href={ContributionVersionController.create()}>
                            <Button className="gap-2">
                                Create Your First Version
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <Table>
                        <TableCaption>A list of all contribution versions.</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Effective From</TableHead>
                                <TableHead>Effective To</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contributionVersions.map((version) => (
                                <TableRow key={version.id}>
                                    <TableCell>
                                        <Badge className={getContributionTypeColor(version.type)}>
                                            {getContributionTypeLabel(version.type)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDate(version.effective_from)}</TableCell>
                                    <TableCell>{formatDate(version.effective_to)}</TableCell>
                                    <TableCell className="space-x-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => viewContributionBrackets(version)}
                                        >
                                            View Brackets
                                        </Button>
                                        <Link 
                                            href={ContributionVersionController.edit(version.id)}
                                            className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                                        >
                                            Edit
                                        </Link>
                                        <Button 
                                            variant="destructive" 
                                            size="sm"
                                            onClick={() => handleDelete(version.id)}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {/* Modal for displaying contribution brackets */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Contribution Brackets - {selectedVersion && getContributionTypeLabel(selectedVersion.type)}
                            </DialogTitle>
                            <DialogDescription>
                                <div className="mt-2 space-y-1">
                                    <p><span className="font-medium">Effective Period:</span> {selectedVersion && formatDate(selectedVersion.effective_from)} to {selectedVersion && formatDate(selectedVersion.effective_to)}</p>
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="mt-4">
                            {selectedVersion?.contribution_brackets && selectedVersion.contribution_brackets.length > 0 ? (
                                <div className="space-y-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Salary Range</TableHead>
                                                <TableHead className="text-right">Employee Share</TableHead>
                                                <TableHead className="text-right">Employer Share</TableHead>
                                                <TableHead className="text-right">Total Contribution</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedVersion.contribution_brackets.map((bracket) => {
                                                const total = bracket.employee_share + bracket.employer_share;
                                                return (
                                                    <TableRow key={bracket.id}>
                                                        <TableCell className="font-medium">
                                                            {formatCurrency(bracket.salary_from)} - {formatCurrency(bracket.salary_to)}
                                                            {bracket.salary_to === 999999999 && ' (and above)'}
                                                        </TableCell>
                                                        <TableCell className="text-right">{formatPercentage(bracket.employee_share)}</TableCell>
                                                        <TableCell className="text-right">{formatPercentage(bracket.employer_share)}</TableCell>
                                                        <TableCell className="text-right font-medium">{formatPercentage(total)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                                        <Percent className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-muted-foreground font-medium mb-1">No brackets found</p>
                                    <p className="text-sm text-gray-500">
                                        This contribution version doesn't have any brackets configured yet.
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
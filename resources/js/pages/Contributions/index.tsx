import { Head, Link, router, useForm } from '@inertiajs/react';
import { Calculator, Percent } from 'lucide-react';
import { useState } from 'react';

import ContributionVersionController from '@/actions/App/Http/Controllers/ContributionVersionController';
import { CustomTable } from '@/components/custom-table';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { ContributionTableConfig } from '@/config/tables/contribution-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { CustomModalView } from '@/components/custom-modal-view';
import { ContributionModalConfig } from '@/config/forms/contribution-modal-view';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomToast, toast } from '@/components/custom-toast';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Contributions', href: '/contributions' },
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
    created_at: string;
    updated_at: string;
}

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface ContributionVersionsPagination {
    data: ContributionVersion[];
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
}

interface FilterProps {
    search: string;
    perPage: string;
}

interface IndexProps {
    contributionVersions: ContributionVersionsPagination;
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function Index({
    contributionVersions,
    filters,
    totalCount,
    filteredCount,
}: IndexProps) {
    console.log('Contribution Versions:', contributionVersions);
    const { delete: destroy } = useForm();
    const [selectedVersion, setSelectedVersion] = useState<ContributionVersion | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData } = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
    });

    // ── Search ─────────────────────────────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setData('search', value);

        router.get(
            ContributionVersionController.index.url(),
            {
                ...(value && { search: value }),
                ...(data.perPage && { perPage: data.perPage }),
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // ── Clear ──────────────────────────────────────────────────────────────────
    const handleReset = () => {
        setData('search', '');
        setData('perPage', '10');
        router.get(ContributionVersionController.index.url(), {}, {
            preserveState: true, preserveScroll: true,
        });
    };

    // ── Per-page ───────────────────────────────────────────────────────────────
    const handlePerPageChange = (value: string) => {
        setData('perPage', value);
        router.get(
            ContributionVersionController.index.url(),
            {
                ...(data.search && { search: data.search }),
                ...(value && { perPage: value }),
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDelete = (id: number | string) => {
        if (confirm('Are you sure you want to delete this contribution version?')) {
            destroy(ContributionVersionController.destroy(id).url, {
                onSuccess: (page) => {
                    const successMessage = page.props.flash?.success || 'Branch created successfully.'
                    toast.success(successMessage);
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).flat()[0] || 'Failed to create branch.';
                    toast.error(errorMessage);
                }
            });
        }
    };

    // ── View brackets ──────────────────────────────────────────────────────────
    const viewBrackets = (version: ContributionVersion) => {
        // Get the first bracket
        const firstBracket = version.contribution_brackets?.[0] || {};

        // Merge version and bracket data
        const mergedData = {
            ...version,
            ...firstBracket,
            // Ensure these fields are at the top level
            salary_from: firstBracket.salary_from,
            salary_to: firstBracket.salary_to,
            employee_share: firstBracket.employee_share,
            employer_share: firstBracket.employer_share,
        };

        setSelectedVersion(mergedData);
        setIsModalOpen(true);
    };

    // ── Edit brackets ──────────────────────────────────────────────────────────
    const editBracket = (version: ContributionVersion) => {
        router.get(ContributionVersionController.edit(version.id).url);
    };

    // ==========================================================================

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contributions" />
            <CustomToast />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                {/* ── Page header ─────────────────────────────────────────── */}
                <div className="flex items-center gap-4 ms-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Calculator className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Contribution Versions</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage SSS, PhilHealth, and Pag-IBIG contribution tables
                        </p>
                    </div>
                </div>

                {/* ── Toolbar ─────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto ms-4">
                        <Input
                            type="text"
                            value={data.search}
                            onChange={handleChange}
                            placeholder="Search contributions..."
                            className="w-full sm:w-80 h-10"
                        />
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            className="h-10 px-4 cursor-pointer whitespace-nowrap"
                        >
                            Clear
                        </Button>
                    </div>

                    <Link
                        href={ContributionVersionController.create()}
                        className="me-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                    >
                        + Create Contribution Version
                    </Link>
                </div>

                {/* ── Empty state (no data at all, not a search miss) ──────── */}
                {contributionVersions.data.length === 0 && !data.search ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="rounded-full bg-gray-100 p-6 mb-4">
                            <Calculator className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No contribution versions yet
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            Create your first contribution version to set up SSS, PhilHealth,
                            and Pag-IBIG contribution tables with their corresponding brackets.
                        </p>
                        <Link href={ContributionVersionController.create()}>
                            <Button>Create Your First Version</Button>
                        </Link>
                    </div >

                ) : (
                    <>
                        {/* Custom Table */}
                        <CustomTable
                            columns={ContributionTableConfig.columns}
                            actions={ContributionTableConfig.actions}
                            data={contributionVersions.data}
                            from={contributionVersions.from}
                            onDelete={handleDelete}
                            onView={viewBrackets}
                            onEdit={editBracket}
                        />


                        {/* ── Pagination ───────────────────────────────────── */}
                        <CustomPagination
                            pagination={contributionVersions}
                            perPage={data.perPage}
                            onPerPageChange={handlePerPageChange}
                            totalCount={totalCount}
                            filteredCount={filteredCount}
                            search={data.search}
                            resourceName="contribution version"
                        />
                    </>
                )
                }
            </div >

            <CustomModalView
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                title={ContributionModalConfig.title}
                description={ContributionModalConfig.description}
                fields={ContributionModalConfig.fields}
                data={selectedVersion}
                headerIcon={<Percent className="h-6 w-6 text-primary" />}
            />

        </AppLayout >
    );
}
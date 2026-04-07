import { Head, useForm } from '@inertiajs/react';
import { Building2, MapPin, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

import { store } from '@/actions/App/Http/Controllers/BranchController';
import InputError from '@/components/input-error';
import SiteRepeater from '@/components/site-repeater';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Branches',
        href: '/branches',
    },
    {
        title: 'Create Branch',
        href: '/branch/create',
    },
];

interface FormData {
    branch_name: string;
    branch_address: string;
    sites: Array<{ site_name: string }>;
}

// interface FlashProps {
//     flash?: {
//         success?: string;
//         error?: string;
//     };
// }

export default function Create() {
    const { data, setData, errors, processing, post } = useForm<FormData>({
        branch_name: '',
        branch_address: '',
        sites: [],
    });

    function submitBranch(e: React.FormEvent) {
        e.preventDefault();
        post(store().url, {
            onSuccess: (page) => {
                const successMessage = page.props.flash?.success || 'Branch created successfully.'
                toast.success(successMessage, {
                    style: {
                        backgroundColor: 'white',
                        color: '#00ca00',
                        border: '1px solid #d5d8d5'
                    }
                });
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to create branch.';
                toast.error(errorMessage, {
                    style: {
                        backgroundColor: 'white',
                        color: '#ff0000',
                        border: '1px solid #d5d8d5'
                    }
                });
            }
        });
    }

    const setSites = (sites: Array<{ site_name: string }>) => {
        setData('sites', sites);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Branch" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Page Header */}
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create New Branch</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Add a new branch and configure its associated sites
                        </p>
                    </div>
                </div>

                <form onSubmit={submitBranch} className="space-y-6">
                    {/* Two-column layout for Branch Info and Sites */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Branch Information Card - Left Column */}
                        <Card className="border shadow-sm overflow-hidden h-fit">
                            <CardHeader className="border-b">
                                <div className="flex items-center gap-3 mt-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                        <Building2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Branch Information</CardTitle>
                                        <CardDescription className="text-sm">
                                            Enter the basic details of the branch
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6 -mt-7">
                                <div className="space-y-5">
                                    {/* Branch Name Field */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <span className="text-primary">*</span>
                                            Branch Name
                                        </label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                value={data.branch_name}
                                                onChange={e => setData('branch_name', e.target.value)}
                                                placeholder="e.g., Main Branch, North Branch"
                                                className="pl-9"
                                            />
                                        </div>
                                        <InputError message={errors.branch_name} />
                                    </div>

                                    {/* Branch Address Field */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <span className="text-primary">*</span>
                                            Branch Address
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                value={data.branch_address}
                                                onChange={e => setData('branch_address', e.target.value)}
                                                placeholder="Enter complete branch address"
                                                className="pl-9"
                                            />
                                        </div>
                                        <InputError message={errors.branch_address} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Branch Sites Card - Right Column */}
                        <Card className="border shadow-sm overflow-hidden h-full">
                            <CardHeader className="border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                            <PlusCircle className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Branch Sites</CardTitle>
                                            <CardDescription className="text-sm">
                                                Add sites under this branch
                                            </CardDescription>
                                        </div>
                                    </div   >

                                    {/* Show count of sites */}
                                    {data.sites.length > 0 && (
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                            {data.sites.length} {data.sites.length === 1 ? 'Site' : 'Sites'}
                                        </span>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="p-6 -mt-7">
                                <SiteRepeater
                                    sites={data.sites}
                                    setSites={setSites}
                                    errors={errors}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="min-w-[100px] gap-2 hover:cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="min-w-[140px] gap-2 hover:cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Building2 className="h-4 w-4" />
                                    Create Branch
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
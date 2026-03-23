import { Head, useForm } from '@inertiajs/react';
import { Building2, MapPin, Pencil, PlusCircle } from 'lucide-react';
import { toast } from '@/components/custom-toast';
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
        title: 'Edit Branch',
        href: '#',
    },
];

interface FormData {
    branch_name: string;
    branch_address: string;
    sites: Array<{ id?: number; site_name: string }>;
}

interface Props {
    branch: {
        branch_slug: string;
        id: number;
        branch_name: string;
        branch_address: string;
        sites: Array<{ id: number; site_name: string }>;
    };
}

export default function Edit({ branch }: Props) {
    const { data, setData, errors, processing, put } = useForm<FormData>({
        branch_name: branch.branch_name || '',
        branch_address: branch.branch_address || '',
        sites: branch.sites || [],
    });

    function submitBranch(e: React.FormEvent) {
        e.preventDefault();
        put(`/branches/${branch.branch_slug}`, {
            onSuccess: (page) => {
                const successMessage = page.props.flash?.success || 'Branch created successfully.'
                toast.success(successMessage, {
                    style: {
                        backgroundColor: 'white',
                        color: '#002dce',
                        border: '1px solid #d5d8d5'
                    }
                });
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to create branch.';
                toast.error(errorMessage, {
                    style: {
                        backgroundColor: 'white',
                        color: 'red',
                        border: '1px solid #d5d8d5'
                    }
                });
            }
        });
    }

    const setSites = (sites: Array<{ id?: number; site_name: string }>) => {
        setData('sites', sites);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Branch" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Page Header */}
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Pencil className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Branch</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Update branch information and manage associated sites
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
                                            Update the basic details of the branch
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
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

                                    {/* Read-only Branch ID/Slug (Optional) */}
                                    <div className=" text-xs text-muted-foreground border-t">
                                        <span className="font-medium">Branch ID: </span>
                                        <span className="font-mono">{branch.id}</span>
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
                                                Manage sites under this branch
                                            </CardDescription>
                                        </div>
                                    </div>

                                    {/* Show count of sites */}
                                    {data.sites.length > 0 && (
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 mt-3 text-xs font-medium text-primary">
                                            {data.sites.length} {data.sites.length === 1 ? 'Site' : 'Sites'}
                                        </span>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="p-6 -mb-5">
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
                            className="min-w-[100px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="min-w-[140px] gap-2"
                        >
                            {processing ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Pencil className="h-4 w-4" />
                                    Update Branch
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
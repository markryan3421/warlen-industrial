import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SiteRepeater from '@/components/site-repeater';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from 'react';

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
        branch_slug: string;
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
        put(`/branches/${branch.branch_slug}`); // Make sure this matches your route
    }

    const setSites = (sites: Array<{ id?: number; site_name: string }>) => {
        setData('sites', sites);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Branch" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Branch</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitBranch} className="space-x-6 grid grid-cols-2">
                            {/* Branch Details Section */}
                            <div className="space-x-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Branch Name
                                    </label>
                                    <Input
                                        type="text"
                                        value={data.branch_name}
                                        onChange={e => setData('branch_name', e.target.value)}
                                        placeholder="Enter branch name"
                                    />
                                    <InputError message={errors.branch_name} />
                                </div>
                            </div>
                            
                            <div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Branch Address
                                    </label>
                                    <Input
                                        type="text"
                                        value={data.branch_address}
                                        onChange={e => setData('branch_address', e.target.value)}
                                        placeholder="Enter branch location"
                                    />
                                    <InputError message={errors.branch_address} />
                                </div>
                            </div>

                            {/* Sites Repeater Section */}
                            <div className="pt-6 col-span-2">
                                <SiteRepeater
                                    sites={data.sites}
                                    setSites={setSites}
                                    errors={errors}
                                />
                            </div>

                            <div className="flex justify-end col-start-2 mb-5 px-5 space-x-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                    className='hover:cursor-pointer'
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className='hover: cursor-pointer hover:bg-blue-600'
                                >
                                    {processing ? 'Updating...' : 'Update Branch'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
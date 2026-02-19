import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SiteRepeater from '@/components/site-repeater';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function Create() {
    const { data, setData, errors, processing, post } = useForm<FormData>({
        branch_name: '',
        branch_address: '',
        sites: [], // Initialize with empty array
    });

    function submitBranch(e: React.FormEvent) {
        e.preventDefault();
        post('/branches'); // Make sure this matches your route
    }

    const setSites = (sites: Array<{ site_name: string }>) => {
        setData('sites', sites);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Branch" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Branch Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitBranch} className="space-y-6">
                            {/* Branch Details Section */}
                            <div className="space-y-4">
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
                            <div className="border-t pt-6">
                                <SiteRepeater
                                    sites={data.sites}
                                    setSites={setSites}
                                    errors={errors}
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                >
                                    {processing ? 'Creating...' : 'Create Branch'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
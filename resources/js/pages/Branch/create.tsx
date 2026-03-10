import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SiteRepeater from '@/components/site-repeater';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { store } from '@/actions/App/Http/Controllers/BranchController';
import { ChevronRight } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Branches',
        href: '/branches',
    },
    {
        title: 'Create Branch',
        href: '/branches/create',
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
        post(store().url); 
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

                            {/* Sites Repeater Section */}
                            <div className="pt-6 col-span-2">
                                <SiteRepeater
                                    sites={data.sites}
                                    setSites={setSites}
                                    errors={errors}
                                />
                            </div>

                            <div className="flex justify-end col-start-2 mb-5 px-5">
                                <Button
                                    className="justify-end"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="justify-end"
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
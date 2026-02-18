import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Branch } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { update } from '@/actions/App/Http/Controllers/BranchController';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Branches',
        href: '/branches',
    },
    {
        title: 'Edit Branch',
        href: '/branch/edit',
    },
];

interface BranchProps {
    branch: Branch
}

export default function Edit({ branch }: BranchProps) {
    const { data, setData, put, errors, processing } = useForm({
        branch_name: branch.branch_name,
        branch_address: branch.branch_address,
    });

    function submitBranch(e) {
        e.preventDefault();
        put(update(branch.id).url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Branch" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <form onSubmit={submitBranch} className="space-y-4">
                    <div>
                        <Input
                            type="text"
                            name="branch_name"
                            placeholder="Branch name"
                            value={data.branch_name}
                            onChange={e => setData('branch_name', e.target.value)}
                        />
                        <InputError message={errors.branch_name} />
                    </div>

                    <div>   
                        <Input
                            type="text"
                            name="branch_address"
                            placeholder="Branch address"
                            value={data.branch_address}
                            onChange={e => setData('branch_address', e.target.value)}
                        />
                        <InputError message={errors.branch_address} />
                    </div>

                    <Button
                        type="submit"
                        disabled={processing}
                    >
                        {processing ? 'Updating...' : 'Update Branch'}
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
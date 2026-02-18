import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm} from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { store } from '@/actions/App/Http/Controllers/BranchController';

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

export default function Create() {
    const { data, setData, errors, processing, submit } = useForm({
       branch_name: '',
       branch_address: '',
    });


    function submitBranch(e) {
        e.preventDefault()
        submit(store());
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Branch" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <form onSubmit={submitBranch} className="space-y-4">
                    <div>
                        <Input
                            type="text"
                            name="branch_name"
                            placeholder="Branch name"
                             onChange={e => setData('branch_name', e.target.value)}
                        />
                        <InputError message={errors.branch_name} />
                    </div>

                      <div>
                        <Input
                            type="text"
                            name="branch_address"
                            placeholder="Location.."
                             onChange={e => setData('branch_address', e.target.value)}
                        />
                        <InputError message={errors.branch_address} />
                    </div>

                    

                    <Button
                        type="submit"
                        disabled={processing}
                    >
                        {processing ? 'Creating...' : 'Create Branch'}
                    </Button>
                </form>

            </div>
        </AppLayout>
    );
}
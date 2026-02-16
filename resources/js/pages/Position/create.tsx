import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { store } from '@/actions/App/Http/Controllers/PositionController';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Posistions',
        href: '/positions',
    },
    {
        title: 'Create Position',
        href: '/position/create',
    },
];

export default function Create() {
    const { data, setData, errors, processing, submit } = useForm({
        pos_name: '',
        salary_rate: '',
        reg_overtime_rate: '',
        special_overtime_rate: '',
        sss_rate: '',
        philhealth_rate: '',
        pagibig_rate: '',
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
                            name="pos_name"
                            placeholder="Position name"
                            value={data.pos_name}
                            onChange={e => setData('pos_name', e.target.value)}
                        />
                        <InputError message={errors.pos_name} />
                    </div>

                    <div>
                        <Input
                            type="number"
                            name="salary_rate"
                            placeholder="Salary rate"
                            value={data.salary_rate}
                            onChange={e => setData('salary_rate', e.target.value)}
                        />
                        <InputError message={errors.salary_rate} />
                    </div>

                    <div>
                        <Input
                            type="number"
                            name="reg_overtime_rate"
                            placeholder="Regular overtime rate"
                            value={data.reg_overtime_rate}
                            onChange={e => setData('reg_overtime_rate', e.target.value)}
                        />
                        <InputError message={errors.reg_overtime_rate} />
                    </div>

                    <div>
                        <Input
                            type="number"
                            name="special_overtime_rate"
                            placeholder="Special overtime rate"
                            value={data.special_overtime_rate}
                            onChange={e => setData('special_overtime_rate', e.target.value)}
                        />
                        <InputError message={errors.special_overtime_rate} />
                    </div>

                    <div>
                        <Input
                            type="number"
                            name="sss_rate"
                            placeholder="SSS rate"
                            value={data.sss_rate}
                            onChange={e => setData('sss_rate', e.target.value)}
                        />
                        <InputError message={errors.sss_rate} />
                    </div>

                    <div>
                        <Input
                            type="number"
                            name="philhealth_rate"
                            placeholder="PhilHealth rate"
                            value={data.philhealth_rate}
                            onChange={e => setData('philhealth_rate', e.target.value)}
                        />
                        <InputError message={errors.philhealth_rate} />
                    </div>

                    <div>
                        <Input
                            type="number"
                            name="pagibig_rate"
                            placeholder="Pag-IBIG rate"
                            value={data.pagibig_rate}
                            onChange={e => setData('pagibig_rate', e.target.value)}
                        />
                        <InputError message={errors.pagibig_rate} />
                    </div>

                    <Button
                        type="submit"
                        disabled={processing}
                    >
                        {processing ? 'Creating...' : 'Create Position'}
                    </Button>
                </form>
            </div>
        </AppLayout>
    );
}
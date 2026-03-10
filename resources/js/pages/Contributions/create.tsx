import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Percent } from "lucide-react";
import { store } from '@/actions/App/Http/Controllers/ContributionVersionController';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contribution Versions',
        href: '/contribution-versions',
    },
    {
        title: 'Create Contribution Version',
        href: '/contribution-version/create',
    },
];

interface SalaryRange {
    salary_from: string;
    salary_to: string;
    employee_share: string;
    employer_share: string;
}

interface FormData {
    type: string;
    effective_from: string;
    effective_to: string;
    salary_ranges: SalaryRange[];
}

export default function Create() {
    const { data, setData, errors, processing, post } = useForm<FormData>({
        type: '',
        effective_from: '',
        effective_to: '',
        salary_ranges: [{
            salary_from: '',
            salary_to: '',
            employee_share: '',
            employer_share: '',
        }],
    });

    function submitContributionVersion(e: React.FormEvent) {
        e.preventDefault();
        post(store().url); 
    }

    const addSalaryRange = () => {
        setData('salary_ranges', [
            ...data.salary_ranges,
            {
                salary_from: '',
                salary_to: '',
                employee_share: '',
                employer_share: '',
            }
        ]);
    };

    const removeSalaryRange = (index: number) => {
        if (data.salary_ranges.length > 1) {
            setData('salary_ranges', data.salary_ranges.filter((_, i) => i !== index));
        }
    };

    const updateSalaryRange = (index: number, field: keyof SalaryRange, value: string) => {
        const updatedRanges = data.salary_ranges.map((range, i) => {
            if (i === index) {
                return { ...range, [field]: value };
            }
            return range;
        });
        setData('salary_ranges', updatedRanges);
    };

    // Helper function to get nested error messages
    const getNestedError = (index: number, field: string) => {
        return errors[`salary_ranges.${index}.${field}`];
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Contribution Version" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Contribution Version Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitContributionVersion} className="space-x-6 grid grid-cols-2">
                            {/* Contribution Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Contribution Type</label>
                                <Select
                                    value={data.type}
                                    onValueChange={(value) => setData('type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select contribution type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sss">SSS</SelectItem>
                                        <SelectItem value="philhealth">PhilHealth</SelectItem>
                                        <SelectItem value="pagibig">Pag-IBIG</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>

                            {/* Effective Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Effective From</label>
                                    <Input
                                        type="date"
                                        value={data.effective_from}
                                        onChange={e => setData('effective_from', e.target.value)}
                                    />
                                    <InputError message={errors.effective_from} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Effective To</label>
                                    <Input
                                        type="date"
                                        value={data.effective_to}
                                        onChange={e => setData('effective_to', e.target.value)}
                                    />
                                    <InputError message={errors.effective_to} />
                                </div>
                            </div>

                            {/* Salary Ranges Repeater */}
                            <div className="space-y-4 col-span-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Salary Ranges & Contributions</label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addSalaryRange}
                                        className='hover: cursor-pointer'
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Range
                                    </Button>
                                </div>

                                {/* Display salary_ranges array error */}
                                {errors.salary_ranges && typeof errors.salary_ranges === 'string' && (
                                    <div className="text-sm text-red-600">
                                        <InputError message={errors.salary_ranges} />
                                    </div>
                                )}

                                {data.salary_ranges.map((range, index) => (
                                    <div key={index} className="relative p-4 border rounded-lg bg-muted/5">
                                        {data.salary_ranges.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background border shadow-sm"
                                                onClick={() => removeSalaryRange(index)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Salary From (₱)</label>
                                                <Input
                                                    type="number"
                                                    value={range.salary_from}
                                                    onChange={e => updateSalaryRange(index, 'salary_from', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                                {/* Display nested error for salary_from */}
                                                <InputError message={getNestedError(index, 'salary_from')} />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Salary To (₱)</label>
                                                <Input
                                                    type="number"
                                                    value={range.salary_to}
                                                    onChange={e => updateSalaryRange(index, 'salary_to', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                                {/* Display nested error for salary_to */}
                                                <InputError message={getNestedError(index, 'salary_to')} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-1">
                                                    <label className="text-sm font-medium">Employee Share</label>
                                                    <Percent className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={range.employee_share}
                                                        onChange={e => updateSalaryRange(index, 'employee_share', e.target.value)}
                                                        placeholder="0.00"
                                                        className="pr-8"
                                                    />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <span className="text-sm text-muted-foreground">%</span>
                                                    </div>
                                                </div>
                                                {/* Display nested error for employee_share */}
                                                <InputError message={getNestedError(index, 'employee_share')} />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center gap-1">
                                                    <label className="text-sm font-medium">Employer Share</label>
                                                    <Percent className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={range.employer_share}
                                                        onChange={e => updateSalaryRange(index, 'employer_share', e.target.value)}
                                                        placeholder="0.00"
                                                        className="pr-8"
                                                    />
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        <span className="text-sm text-muted-foreground">%</span>
                                                    </div>
                                                </div>
                                                {/* Display nested error for employer_share */}
                                                <InputError message={getNestedError(index, 'employer_share')} />
                                            </div>
                                        </div>

                                        {/* Optional: Add helper text */}
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            <p>Enter contribution percentage (e.g., 10 for 10%)</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end col-start-2 space-x-3 p-5">
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
                                    className='hover:cursor-pointer'
                                >
                                    {processing ? 'Creating...' : 'Create Contribution Version'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
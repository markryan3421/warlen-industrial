import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { update } from '@/actions/App/Http/Controllers/ContributionVersionController';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contribution Versions',
        href: '/contribution-versions',
    },
    {
        title: 'Edit Contribution Version',
        href: '/contribution-version/edit',
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

interface EditProps {
    contributionVersion: {
        id: number;
        type: string;
        effective_from: string;
        effective_to: string;
        contribution_brackets: Array<{
            id: number;
            salary_from: string;
            salary_to: string;
            employee_share: string;
            employer_share: string;
        }>;
    };
}

export default function Edit({ contributionVersion }: EditProps) {

    const initialSalaryRanges = contributionVersion.contribution_brackets.map(bracket => ({
        salary_from: bracket.salary_from,
        salary_to: bracket.salary_to,
        employee_share: bracket.employee_share,
        employer_share: bracket.employer_share,
    }));

    const { data, setData, errors, processing, put } = useForm<FormData>({
        type: contributionVersion.type || '',
        effective_from: contributionVersion.effective_from || '',
        effective_to: contributionVersion.effective_to || '',
        salary_ranges: initialSalaryRanges.length > 0 ? initialSalaryRanges : [{
            salary_from: '',
            salary_to: '',
            employee_share: '',
            employer_share: '',
        }],
    });

    function submitContributionVersion(e: React.FormEvent) {
        e.preventDefault();
        put(update(contributionVersion.id).url); 
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Contribution Version" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Contribution Version</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitContributionVersion} className="space-y-6">
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
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Salary Ranges & Contributions</label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addSalaryRange}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Range
                                    </Button>
                                </div>

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
                                                <label className="text-sm font-medium">Salary From</label>
                                                <Input
                                                    type="number"
                                                    value={range.salary_from}
                                                    onChange={e => updateSalaryRange(index, 'salary_from', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                                {errors[`salary_ranges.${index}.salary_from`] && (
                                                    <InputError message={errors[`salary_ranges.${index}.salary_from`]} />
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Salary To</label>
                                                <Input
                                                    type="number"
                                                    value={range.salary_to}
                                                    onChange={e => updateSalaryRange(index, 'salary_to', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                                {errors[`salary_ranges.${index}.salary_to`] && (
                                                    <InputError message={errors[`salary_ranges.${index}.salary_to`]} />
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Employee Share</label>
                                                <Input
                                                    type="number"
                                                    value={range.employee_share}
                                                    onChange={e => updateSalaryRange(index, 'employee_share', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                                {errors[`salary_ranges.${index}.employee_share`] && (
                                                    <InputError message={errors[`salary_ranges.${index}.employee_share`]} />
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Employer Share</label>
                                                <Input
                                                    type="number"
                                                    value={range.employer_share}
                                                    onChange={e => updateSalaryRange(index, 'employer_share', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                                {errors[`salary_ranges.${index}.employer_share`] && (
                                                    <InputError message={errors[`salary_ranges.${index}.employer_share`]} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <InputError message={errors.salary_ranges} />
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                >
                                    {processing ? 'Updating...' : 'Update Contribution Version'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
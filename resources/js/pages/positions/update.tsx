import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, X, DollarSign, Briefcase, CheckCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Positions',
        href: '/positions',
    },
    {
        title: 'Update Position',
        href: '#',
    },
];

interface Position {
    pos_slug: string;
    id: number;
    pos_name: string;
    basic_salary: number;
    is_salary_fixed: boolean;
}

interface PageProps {
    position: Position;
}

export default function Update({ position }: PageProps) {
    const { data, setData, put, processing, errors } = useForm({
        pos_name: position.pos_name,
        basic_salary: position.basic_salary,
        is_salary_fixed: position.is_salary_fixed,
    })
    
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/positions/${position.pos_slug}`);
    };

    const handleSalaryToggle = (checked: boolean) => {
        setData('is_salary_fixed', checked);
    }

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Update Position" />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl"
            >
                {/* Header Section */}
                <div className="mb-8">
                    <Link 
                        href="/positions" 
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Positions
                    </Link>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Update Position
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Modify position details and salary configuration
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                                <Briefcase className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-primary">Edit Mode</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-card rounded-xl border shadow-sm overflow-hidden"
                >
                    <form onSubmit={submit} className="p-6 sm:p-8 lg:p-10">
                        <div className="space-y-8 max-w-3xl mx-auto">
                            {/* Position Name Field */}
                            <motion.div 
                                className="space-y-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-primary" />
                                    Position Name
                                    <span className="text-red-500 text-sm font-normal">*</span>
                                </Label>
                                <Input 
                                    id="name" 
                                    value={data.pos_name} 
                                    onChange={e => setData('pos_name', e.target.value)} 
                                    className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Enter position name"
                                    disabled={processing}
                                />
                                <InputError message={errors.pos_name} />
                            </motion.div>
                            
                            {/* Fixed Salary Toggle */}
                            <motion.div 
                                className="space-y-3 p-4 bg-muted/30 rounded-lg border"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="salary-fixed" className="text-base font-semibold">
                                            Fixed Salary Configuration
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Enable if this position has a predetermined salary amount
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">Flexible</span>
                                        <Switch
                                            id="salary-fixed"
                                            checked={data.is_salary_fixed}
                                            onCheckedChange={handleSalaryToggle}
                                            disabled={processing}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                        <span className="text-sm text-muted-foreground">Fixed</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Basic Salary Field */}
                            <motion.div 
                                className="space-y-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.4 }}
                            >
                                <Label htmlFor="basic-salary" className="text-base font-semibold flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-primary" />
                                    Basic Salary
                                    <span className="text-red-500 text-sm font-normal">*</span>
                                </Label>
                                
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-muted-foreground sm:text-sm">₱</span>
                                    </div>
                                    <Input 
                                        type='number' 
                                        value={data.basic_salary} 
                                        onChange={e => setData('basic_salary', e.target.value)} 
                                        className="w-full pl-7 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Enter basic salary" 
                                        min={1}
                                        step={data.is_salary_fixed ? "1" : "0.01"}
                                        disabled={processing}
                                    />
                                </div>
                                
                                <InputError message={errors.basic_salary} />
                                
                                <AnimatePresence>
                                    {data.is_salary_fixed && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="mt-2"
                                        >
                                            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                                                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                                <p>This position has a fixed salary of {formatCurrency(data.basic_salary)}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                {!data.is_salary_fixed && data.basic_salary > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-sm text-green-600 dark:text-green-400"
                                    >
                                        Base salary set to {formatCurrency(data.basic_salary)} (flexible range)
                                    </motion.div>
                                )}
                            </motion.div>
                            
                            {/* Action Buttons */}
                            <motion.div 
                                className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.5 }}
                            >
                                <Link href="/positions" className="w-full sm:w-auto">
                                    <Button 
                                        variant="outline" 
                                        className="w-full gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all duration-200"
                                        disabled={processing}
                                    >
                                        <X className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                </Link>
                                <Button 
                                    type="submit" 
                                    disabled={processing} 
                                    className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {processing ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Update Position
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        </div>
                    </form>
                </motion.div>

                {/* Preview Section (Optional) */}
                {data.basic_salary > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border"
                    >
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Salary Preview</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="p-3 bg-background rounded-lg">
                                <p className="text-xs text-muted-foreground">Position</p>
                                <p className="font-semibold">{data.pos_name || 'Not set'}</p>
                            </div>
                            <div className="p-3 bg-background rounded-lg">
                                <p className="text-xs text-muted-foreground">Salary Type</p>
                                <p className="font-semibold">
                                    {data.is_salary_fixed ? 'Fixed' : 'Flexible Range'}
                                </p>
                            </div>
                            <div className="p-3 bg-background rounded-lg">
                                <p className="text-xs text-muted-foreground">Basic Salary</p>
                                <p className="font-semibold text-primary">
                                    {data.basic_salary ? formatCurrency(data.basic_salary) : 'Not set'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AppLayout>
    );
}
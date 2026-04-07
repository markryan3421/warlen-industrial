import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/section-chart';
// import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { StaticTable } from '@/components/static-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; // Import Switch component if available
import AppLayout from '@/layouts/hr-layout';
import { ArrowLeft, PlusCircle, Briefcase, CheckCircle, DollarSign, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BreadcrumbItem } from '@/types';
import { toast } from '@/components/custom-toast';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Positions',
        href: '/hr/positions',
    },
    {
        title: 'Create Position',
        href: '/hr/positions/create',
    },
];

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        pos_name: '',
        basic_salary: '',
        is_salary_fixed: false,
    })
    
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/hr/positions', {
            onSuccess: (page: { props: any; }) => {
                const successMessage = (page.props as any).flash?.success || 'Position created successfully.';
                toast.success(successMessage);
            },
            onError: (errors: { [s: string]: unknown; } | ArrayLike<unknown>) => {
                const errorMessage = String(Object.values(errors).flat()[0]) || 'Failed to create position.';
                toast.error(errorMessage);
            },
        });
    }

    const handleSalaryToggle = (checked: boolean) => {
        setData('is_salary_fixed', checked);
    }

    // Format currency for preview
    const formatCurrency = (value: string | number) => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue) || numValue === 0) return 'Not set';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numValue);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Position" />
            
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
                                Create New Position
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Define a new job role and configure salary settings
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                                <PlusCircle className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-primary">New Position</span>
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
                                    placeholder="e.g., Software Engineer, HR Manager, Accountant"
                                    disabled={processing}
                                    autoFocus
                                />
                                <InputError message={errors.pos_name} />
                                <p className="text-xs text-muted-foreground">
                                    Choose a descriptive name that clearly identifies the role
                                </p>
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
                                    {data.is_salary_fixed && data.basic_salary && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="mt-2"
                                        >
                                            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                                                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                                <p>This position will have a fixed salary of {formatCurrency(data.basic_salary)}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                {!data.is_salary_fixed && data.basic_salary && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-sm text-green-600 dark:text-green-400"
                                    >
                                        Base salary set to {formatCurrency(data.basic_salary)} (flexible range)
                                    </motion.div>
                                )}
                                
                                {!data.basic_salary && (
                                    <p className="text-xs text-muted-foreground">
                                        Enter the minimum or fixed salary amount for this position
                                    </p>
                                )}
                            </motion.div>
                            
                            {/* Action Buttons */}
                            <motion.div 
                                className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.5 }}
                            >
                                <Link href="/hr/positions" className="w-full sm:w-auto">
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
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Create Position
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        </div>
                    </form>
                </motion.div>

                {/* Preview Section - Shows live preview as user types */}
                {(data.pos_name || data.basic_salary) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border"
                    >
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Position Preview
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="p-3 bg-background rounded-lg transition-all hover:shadow-md">
                                <p className="text-xs text-muted-foreground">Position Name</p>
                                <p className="font-semibold text-lg">
                                    {data.pos_name || <span className="text-muted-foreground italic">Not set</span>}
                                </p>
                            </div>
                            <div className="p-3 bg-background rounded-lg transition-all hover:shadow-md">
                                <p className="text-xs text-muted-foreground">Salary Type</p>
                                <p className="font-semibold">
                                    {data.is_salary_fixed ? (
                                        <span className="text-blue-600 dark:text-blue-400">Fixed</span>
                                    ) : (
                                        <span className="text-green-600 dark:text-green-400">Flexible Range</span>
                                    )}
                                </p>
                            </div>
                            <div className="p-3 bg-background rounded-lg transition-all hover:shadow-md">
                                <p className="text-xs text-muted-foreground">Basic Salary</p>
                                <p className="font-semibold text-primary text-lg">
                                    {data.basic_salary ? formatCurrency(data.basic_salary) : <span className="text-muted-foreground italic">Not set</span>}
                                </p>
                            </div>
                        </div>
                        
                        {/* Additional Info */}
                        {data.pos_name && data.basic_salary && (
                            <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                <p className="text-sm text-center text-muted-foreground">
                                    Ready to create <strong className="text-primary">{data.pos_name}</strong> position with 
                                    {data.is_salary_fixed ? ' fixed salary of ' : ' flexible starting salary of '}
                                    <strong className="text-primary">{formatCurrency(data.basic_salary)}</strong>
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </motion.div>
        </AppLayout>
    );
}
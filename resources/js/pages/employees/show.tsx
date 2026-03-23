// resources/js/pages/employees/show.tsx
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Calendar, MapPin, Building2, Briefcase, CreditCard, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import EmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import { useState, useEffect } from 'react';

interface Employee {
    id: number;
    slug_emp: string;
    emp_code: number;
    employee_number: string;
    emergency_contact_number: string;
    contract_start_date: string;
    contract_end_date: string;
    pay_frequency: 'weekender' | 'monthly' | 'semi_monthly';
    employee_status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
    position: {
        id: number;
        pos_name: string;
        deleted_at: string | null;
    } | null;
    branch: {
        id: number;
        branch_name: string;
        branch_address: string;
    } | null;
    site: {
        id: number;
        site_name: string;
    } | null;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

interface PageProps {
    employee: Employee;
}

export default function Show({ employee }: PageProps) {
    const { delete: destroy } = useForm();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        destroy(EmployeeController.destroy(employee.slug_emp).url, {
            onFinish: () => {
                setIsDeleting(false);
                setIsDeleteDialogOpen(false);
            },
        });
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employees', href: '/employees' },
        { title: employee.user?.name ?? `Employee #${employee.emp_code}`, href: `/employees/${employee.slug_emp}` },
    ];

    const statusColor = employee.employee_status === 'active'
        ? 'bg-green-100 text-green-800 border-green-200'
        : 'bg-yellow-100 text-yellow-800 border-yellow-200';

    // Helper to get initials for avatar placeholder
    const getInitials = (name?: string) => {
        if (!name) return '?';
        return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
    };

    // Animation classes (can be moved to global CSS, but inline for simplicity)
    const fadeInUp = 'animate-fade-in-up';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Employee: ${employee.user?.name ?? employee.emp_code}`} />

            <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
                {/* Header with actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <Link href="/employees" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to list</span>
                    </Link>
                    <div className="flex gap-2 self-start sm:self-auto">
                        <Link href={EmployeeController.edit(employee.slug_emp).url}>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Confirm deletion</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete employee <span className="font-semibold">{employee.user?.name}</span>? This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                                        Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Employee card with entrance animation */}
                <div className={`${fadeInUp} animation-delay-100`}>
                    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        {/* Header with gradient background */}
                        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                {/* Avatar placeholder */}
                                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold shadow-md">
                                    {getInitials(employee.user?.name)}
                                </div>
                                <div>
                                    <CardTitle className="text-2xl md:text-3xl flex items-center gap-3 flex-wrap">
                                        {employee.user?.name}
                                        <Badge variant="outline" className={`${statusColor} border-0 px-3 py-0.5 text-xs font-semibold animate-pulse`}>
                                            {employee.employee_status}
                                        </Badge>
                                    </CardTitle>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <Mail className="h-3.5 w-3.5" />
                                            {employee.user?.email || '—'}
                                        </span>
                                        {employee.emergency_contact_number && (
                                            <span className="inline-flex items-center gap-1">
                                                <Phone className="h-3.5 w-3.5" />
                                                {employee.emergency_contact_number}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left column: Personal & Employment */}
                                <div className="space-y-6">
                                    <SectionCard icon={User} title="Personal Information">
                                        <InfoRow label="Employee Code" value={employee.emp_code} />
                                        <InfoRow label="Employee Number" value={employee.employee_number} />
                                        <InfoRow label="Emergency Contact" value={employee.emergency_contact_number || '—'} />
                                    </SectionCard>

                                    <SectionCard icon={Briefcase} title="Position & Pay">
                                        <InfoRow label="Position" value={employee.position?.pos_name || <span className="italic text-muted-foreground">Not assigned</span>} />
                                        <InfoRow label="Pay Frequency" value={employee.pay_frequency.replace('_', ' ')} capitalize />
                                    </SectionCard>
                                </div>

                                {/* Right column: Work Location & Contract */}
                                <div className="space-y-6">
                                    <SectionCard icon={MapPin} title="Work Location">
                                        <InfoRow label="Branch" value={employee.branch?.branch_name || '—'} />
                                        {employee.branch?.branch_address && (
                                            <InfoRow label="Address" value={employee.branch.branch_address} />
                                        )}
                                        <InfoRow label="Site" value={employee.site?.site_name || '—'} />
                                    </SectionCard>

                                    <SectionCard icon={Calendar} title="Contract">
                                        <InfoRow label="Start Date" value={formatDate(employee.contract_start_date)} />
                                        <InfoRow label="End Date" value={formatDate(employee.contract_end_date)} />
                                    </SectionCard>

                                    <SectionCard icon={Clock} title="System Info">
                                        <InfoRow label="Created" value={formatDate(employee.created_at)} />
                                        <InfoRow label="Last Updated" value={formatDate(employee.updated_at)} />
                                    </SectionCard>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Simple CSS animations (could be moved to global styles) */}
            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                }
                .animation-delay-100 {
                    animation-delay: 100ms;
                }
            `}</style>
        </AppLayout>
    );
}

// Helper components for cleaner JSX
function SectionCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 border-b pb-2 mb-3">
                <Icon className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
            </div>
            <dl className="space-y-2 text-sm">{children}</dl>
        </div>
    );
}

function InfoRow({ label, value, capitalize = false }: { label: string; value: React.ReactNode; capitalize?: boolean }) {
    return (
        <div className="flex justify-between items-start">
            <dt className="text-muted-foreground">{label}:</dt>
            <dd className={`font-medium text-right ${capitalize ? 'capitalize' : ''}`}>{value}</dd>
        </div>
    );
}
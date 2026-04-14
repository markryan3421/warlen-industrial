import { Head, Link, router, useForm } from '@inertiajs/react';
import { format, isToday } from 'date-fns';
import { Calculator, Percent, Plus, Trash2, LoaderCircle, Filter, Handshake, Users, Settings, Save, Shield, Heart } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

import { CustomHeader } from '@/components/custom-header';
import { CustomModalView } from '@/components/custom-modal-view';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomTable } from '@/components/custom-table';
import { CustomToast, toast } from '@/components/custom-toast';
import InputError from '@/components/input-error';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ContributionModalConfig } from '@/config/forms/contribution-modal-view';
import { ContributionTableConfig } from '@/config/tables/contribution-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';

// Helper function to generate route URLs
const route = (name: string, params?: any) => {
    if (window.route) {
        return window.route(name, params);
    }
    const urls: Record<string, string> = {
        'contribution-versions.index': '/contributions',
        'contribution-versions.store': '/contributions',
        'contribution-versions.update': `/contributions/${params?.contribution_version || ''}`,
        'contribution-versions.destroy': `/contributions/${params?.contribution_version || ''}`,
    };
    return urls[name] || '/contributions';
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Contributions', href: '/contributions' },
];

interface ContributionBracket {
    id: number;
    salary_from: number;
    salary_to: number;
    employee_share: number;
    employer_share: number;
}

interface ContributionVersion {
    id: number;
    type: 'sss' | 'philhealth' | 'pagibig';
    contribution_brackets: ContributionBracket[];
    created_at: string;
    updated_at: string;
}

interface ContributionVersionsPagination {
    data: ContributionVersion[];
    from: number;
    to: number;
    total: number;
    current_page?: number;
    last_page?: number;
    per_page?: number;
    links?: any[];
}

interface IndexProps {
    contributionVersions: ContributionVersionsPagination;
}

interface Employee {
    id: number;
    user: {
        id: number;
        name: string;
    };
}

interface EmployeeContributionSettingData {
    id?: number;
    employee_id: number;
    contribution_version_id: number;
    is_exempted: boolean;
    fixed_amount: string | null;
    monthly_cap: string | null;
}

// Form interfaces
interface SalaryRange {
    salary_from: string;
    salary_to: string;
    employee_share: string;
    employer_share: string;
}

interface FormData {
    type: string;
    salary_ranges: SalaryRange[];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const getContributionTypeColor = (type: string) => {
    switch (type) {
        case 'sss':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'philhealth':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'pagibig':
            return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getContributionTypeBgColor = (type: string) => {
    switch (type) {
        case 'sss':
            return 'bg-blue-50';
        case 'philhealth':
            return 'bg-green-50';
        case 'pagibig':
            return 'bg-purple-50';
        default:
            return 'bg-gray-50';
    }
};

const getContributionTypeLabel = (type: string) => {
    switch (type) {
        case 'sss':
            return 'SSS';
        case 'philhealth':
            return 'PhilHealth';
        case 'pagibig':
            return 'Pag-IBIG';
        default:
            return type.charAt(0).toUpperCase() + type.slice(1);
    }
};

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function Index({
    contributionVersions,
}: IndexProps) {
    const { delete: destroy } = useForm();
    const [selectedVersion, setSelectedVersion] = useState<ContributionVersion | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBracketsModalOpen, setIsBracketsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingVersion, setEditingVersion] = useState<ContributionVersion | null>(null);

    // Filter states
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [hasActiveFilters, setHasActiveFilters] = useState(false);

    // Delete confirmation states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState('versions');

    // Employee settings states
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [employeeSettings, setEmployeeSettings] = useState<Record<number, Record<number, EmployeeContributionSettingData>>>({});
    const [originalEmployeeSettings, setOriginalEmployeeSettings] = useState<Record<number, Record<number, EmployeeContributionSettingData>>>({});
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [savingSettings, setSavingSettings] = useState<Record<number, boolean>>({});

    const handleDeleteClick = (contributionVersion: ContributionVersion) => {
        setItemToDelete(contributionVersion);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        destroy(route('contribution-versions.destroy', { contribution_version: itemToDelete.id }), {
            onSuccess: (page) => {
                const successMessage = (page.props as any).flash?.success || 'Contribution version deleted successfully.';
                toast.success(successMessage);
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete contribution version.';
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    // Safely ensure data is an array and remove duplicates based on ID
    const versions = useMemo(() => {
        if (!contributionVersions?.data) return [];
        const data = Array.isArray(contributionVersions.data) ? contributionVersions.data : [];
        const uniqueMap = new Map();
        data.forEach(item => uniqueMap.set(item.id, item));
        return Array.from(uniqueMap.values());
    }, [contributionVersions]);

    // Filtered data based on type filter
    const displayData = useMemo(() => {
        if (!typeFilter || typeFilter === 'all') {
            return versions;
        }
        return versions.filter(version => version.type === typeFilter);
    }, [versions, typeFilter]);

    // Update hasActiveFilters when filters change
    useEffect(() => {
        setHasActiveFilters(!!typeFilter && typeFilter !== 'all');
    }, [typeFilter]);

    // Get existing contribution types
    const existingTypes = useMemo(() => {
        return versions.map(version => version.type);
    }, [versions]);

    const handleTypeFilterChange = (value: string) => {
        setTypeFilter(value);
    };

    const handleClearAllFilters = () => {
        setTypeFilter("");
    };

    const viewBrackets = (version: ContributionVersion) => {
        setSelectedVersion(version);
        setIsBracketsModalOpen(true);
    }

    const viewDetails = (version: ContributionVersion) => {
        const firstBracket = version.contribution_brackets?.[0] || {};
        const mergedData = {
            ...version,
            ...firstBracket,
            salary_from: firstBracket.salary_from,
            salary_to: firstBracket.salary_to,
            employee_share: firstBracket.employee_share,
            employer_share: firstBracket.employer_share,
        };
        setSelectedVersion(mergedData);
        setIsModalOpen(true);
    };

    const handleEdit = (version: ContributionVersion) => {
        setEditingVersion(version);
        setIsEditModalOpen(true);
    };

    const hasRecords = versions.length > 0;

    // Fetch employees and their settings
    const fetchEmployeesAndSettings = async () => {
        if (!hasRecords) return;

        setLoadingEmployees(true);
        try {
            // Fetch employees
            const employeesResponse = await fetch('/employees/list');
            const employeesData = await employeesResponse.json();

            let employeesList = [];
            if (employeesData.data && Array.isArray(employeesData.data)) {
                employeesList = employeesData.data;
            } else if (Array.isArray(employeesData)) {
                employeesList = employeesData;
            } else {
                employeesList = [];
            }
            setEmployees(employeesList);

            // Fetch settings for all contribution versions
            const settingsPromises = versions.map(version =>
                fetch(`/employee-contribution-settings?contribution_version_id=${version.id}`)
                    .then(res => {
                        if (!res.ok) throw new Error('Failed to fetch settings');
                        return res.json();
                    })
                    .catch(() => [])
            );

            const allSettings = await Promise.all(settingsPromises);

            const settingsMap: Record<number, Record<number, EmployeeContributionSettingData>> = {};
            versions.forEach((version, index) => {
                settingsMap[version.id] = {};
                const settingsArray = Array.isArray(allSettings[index]) ? allSettings[index] : [];
                settingsArray.forEach((setting: EmployeeContributionSettingData) => {
                    settingsMap[version.id][setting.employee_id] = setting;
                });
            });

            setEmployeeSettings(settingsMap);
            // Store original settings for comparison
            setOriginalEmployeeSettings(JSON.parse(JSON.stringify(settingsMap)));
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            toast.error('Failed to load employees');
        } finally {
            setLoadingEmployees(false);
        }
    };

    // Fetch employees when versions load and tab is active
    useEffect(() => {
        if (hasRecords && activeTab === 'employee-settings') {
            fetchEmployeesAndSettings();
        }
    }, [versions.length, activeTab]);

    const updateEmployeeSetting = (
        contributionVersionId: number,
        employeeId: number,
        field: string,
        value: any
    ) => {
        setEmployeeSettings(prev => ({
            ...prev,
            [contributionVersionId]: {
                ...prev[contributionVersionId],
                [employeeId]: {
                    ...prev[contributionVersionId]?.[employeeId],
                    employee_id: employeeId,
                    contribution_version_id: contributionVersionId,
                    [field]: value
                }
            }
        }));
    };

    const saveContributionSettings = (contributionVersionId: number) => {
        const currentSettings = employeeSettings[contributionVersionId] || {};
        const originalSettings = originalEmployeeSettings[contributionVersionId] || {};

        // Find only changed settings
        const changedSettings = [];
        const allEmployeeIds = new Set([...Object.keys(currentSettings), ...Object.keys(originalSettings)]);

        for (const employeeId of allEmployeeIds) {
            const current = currentSettings[Number(employeeId)];
            const original = originalSettings[Number(employeeId)];

            // Compare if setting has changed
            const hasChanged = JSON.stringify({
                is_exempted: current?.is_exempted || false,
                fixed_amount: current?.fixed_amount || null,
                monthly_cap: current?.monthly_cap || null,
            }) !== JSON.stringify({
                is_exempted: original?.is_exempted || false,
                fixed_amount: original?.fixed_amount || null,
                monthly_cap: original?.monthly_cap || null,
            });

            if (hasChanged && current) {
                changedSettings.push({
                    employee_id: Number(employeeId),
                    is_exempted: current.is_exempted || false,
                    fixed_amount: current.fixed_amount || null,
                    monthly_cap: current.monthly_cap || null,
                });
            }
        }

        // If no changes, show message and return
        if (changedSettings.length === 0) {
            toast.info('No changes to save');
            return;
        }

        setSavingSettings(prev => ({ ...prev, [contributionVersionId]: true }));

        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        fetch('/employee-contribution-settings/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken || '',
                'Accept': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                contribution_version_id: contributionVersionId,
                settings: changedSettings,
            }),
        })
            .then(async response => {
                const data = await response.json();
                if (response.ok) {
                    toast.success(`${data.message || 'Settings saved successfully!'} (${changedSettings.length} employee${changedSettings.length > 1 ? 's' : ''} updated)`);
                    // Update original settings after successful save
                    const updatedOriginalSettings = { ...originalEmployeeSettings };
                    for (const setting of changedSettings) {
                        if (!updatedOriginalSettings[contributionVersionId]) {
                            updatedOriginalSettings[contributionVersionId] = {};
                        }
                        updatedOriginalSettings[contributionVersionId][setting.employee_id] = {
                            employee_id: setting.employee_id,
                            contribution_version_id: contributionVersionId,
                            is_exempted: setting.is_exempted,
                            fixed_amount: setting.fixed_amount,
                            monthly_cap: setting.monthly_cap,
                        };
                    }
                    setOriginalEmployeeSettings(updatedOriginalSettings);
                } else {
                    toast.error(data.message || 'Failed to save settings');
                }
            })
            .catch(error => {
                console.error('Save error:', error);
                toast.error('An error occurred while saving');
            })
            .finally(() => {
                setSavingSettings(prev => ({ ...prev, [contributionVersionId]: false }));
            });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contributions" />

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .pp-row { animation: fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both; }
                @keyframes headerReveal {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .pp-header { animation: headerReveal 0.35s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

            <CustomToast />
            <div className="flex h-full flex flex-col gap-4 rounded-xl p-4 mx-4 -mt-1">

                <div className="flex flex-row justify-between gap-4 mt-2 pp-header">
                    <CustomHeader
                        icon={<Handshake className="h-6 w-6" />}
                        title="Contributions"
                        description="Manage contribution versions for SSS, PhilHealth, and Pag-IBIG, including their salary brackets and contribution percentages."
                    />

                    {hasRecords && activeTab === 'versions' && (
                        <div className="flex justify-end items-center gap-4">
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Create Contribution Version
                            </Button>
                        </div>
                    )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="versions" className="gap-2">
                            <Percent className="h-4 w-4" />
                            Contribution Versions
                        </TabsTrigger>
                        <TabsTrigger value="employee-settings" className="gap-2">
                            <Users className="h-4 w-4" />
                            Employee Settings
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Contribution Versions */}
                    <TabsContent value="versions">
                        {!hasRecords ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                    <div className="rounded-full bg-primary/10 p-6 mb-4">
                                        <Calculator className="h-12 w-12 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No contribution versions yet</h3>
                                    <p className="text-muted-foreground mb-6 max-w-sm">
                                        Create your first contribution version to set up SSS, PhilHealth, and Pag-IBIG contribution tables with their corresponding brackets.
                                    </p>
                                    <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Create Your First Version
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {displayData.length === 0 ? (
                                    <Card>
                                        <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                            <div className="rounded-full bg-muted p-6 mb-4">
                                                <Filter className="h-12 w-12 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2">No results found</h3>
                                            <p className="text-muted-foreground mb-6 max-w-sm">
                                                No contribution versions match your filter criteria.
                                            </p>
                                            {hasActiveFilters && (
                                                <Button variant="outline" onClick={handleClearAllFilters}>
                                                    Clear Filters
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <CardContent className="p-0 pp-row">
                                        <CustomTable
                                            columns={ContributionTableConfig.columns}
                                            actions={ContributionTableConfig.actions}
                                            data={displayData}
                                            from={contributionVersions.from}
                                            onDelete={handleDeleteClick}
                                            onView={viewBrackets}
                                            onEdit={handleEdit}
                                            title="Contribution Table"
                                        />
                                    </CardContent>
                                )}

                                {displayData.length > 0 && contributionVersions && (
                                    <CustomPagination className="pp-row"
                                        pagination={{
                                            data: displayData,
                                            from: contributionVersions.from,
                                            to: contributionVersions.to,
                                            total: contributionVersions.total,
                                            current_page: contributionVersions.current_page || 1,
                                            last_page: contributionVersions.last_page || 1,
                                            per_page: contributionVersions.per_page || 10,
                                            links: contributionVersions.links || []
                                        }}
                                        perPage={(contributionVersions.per_page || 10).toString()}
                                        onPerPageChange={(value) => {
                                            router.get(
                                                route('contribution-versions.index'),
                                                { perPage: value, type: typeFilter !== 'all' ? typeFilter : undefined },
                                                { preserveState: true }
                                            );
                                        }}
                                        totalCount={contributionVersions.total}
                                        filteredCount={displayData.length}
                                        search={typeFilter && typeFilter !== 'all' ? `Type: ${getContributionTypeLabel(typeFilter)}` : ''}
                                        resourceName="contribution version"
                                    />
                                )}
                            </>
                        )}
                    </TabsContent>

{/* Tab 2: Employee Contribution Settings - With SSS Manual Input */}
<TabsContent value="employee-settings">
    <div className="space-y-6">
        {loadingEmployees ? (
            <Card>
                <CardContent className="flex items-center justify-center py-16">
                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading employees...</span>
                </CardContent>
            </Card>
        ) : employees.length === 0 ? (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">No active employees found</p>
                    <p className="text-sm text-muted-foreground mt-1">Please add active employees first to configure contribution settings.</p>
                </CardContent>
            </Card>
        ) : (
            versions.map((version) => {
                const settingsForVersion = employeeSettings[version.id] || {};
                const isSaving = savingSettings[version.id] || false;
                const totalEmployees = employees.length;
                const exemptedCount = Object.values(settingsForVersion).filter(s => s.is_exempted).length;
                const allExempted = exemptedCount === totalEmployees && totalEmployees > 0;

                // Determine contribution type
                const isPhilHealth = version.type === 'philhealth';
                const isPagIbig = version.type === 'pagibig';
                const isSSS = version.type === 'sss';

                // Bulk action handlers
                const setAllExempted = (exempted: boolean) => {
                    employees.forEach((employee) => {
                        updateEmployeeSetting(version.id, employee.id, 'is_exempted', exempted);
                    });
                    toast.success(`All employees ${exempted ? 'exempted from' : 'enabled for'} ${getContributionTypeLabel(version.type)}`);
                };

                const setAllFixedAmount = (amount: string) => {
                    if (!allExempted) {
                        employees.forEach((employee) => {
                            const currentSetting = settingsForVersion[employee.id] || {};
                            if (!currentSetting.is_exempted) {
                                updateEmployeeSetting(version.id, employee.id, 'fixed_amount', amount);
                            }
                        });
                        toast.success(`Fixed amount set to ${isPhilHealth ? amount + '%' : '₱' + amount} for all non-exempted employees`);
                    }
                };

                const setAllMonthlyCap = (cap: string) => {
                    if (!isSSS && !allExempted) {
                        employees.forEach((employee) => {
                            const currentSetting = settingsForVersion[employee.id] || {};
                            if (!currentSetting.is_exempted) {
                                updateEmployeeSetting(version.id, employee.id, 'monthly_cap', cap);
                            }
                        });
                        toast.success(`Monthly cap set to ₱${cap} for all non-exempted employees`);
                    }
                };

                return (
                    <Card key={version.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                        {/* Card Header with Gradient */}
                        <div className={`${getContributionTypeBgColor(version.type)} border-b`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${getContributionTypeColor(version.type)} bg-white shadow-sm`}>
                                            {isSSS ? (
                                                <Shield className="h-5 w-5" />
                                            ) : (
                                                <Heart className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl flex items-center gap-2">
                                                {getContributionTypeLabel(version.type)}
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    {isSSS ? 'Manual Input per Payroll' : (isPhilHealth ? 'Percentage Based (5% default)' : 'Fixed Amount')}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {isSSS
                                                    ? 'Set custom SSS contribution amount per employee. This amount will be used during payroll calculation.'
                                                    : isPhilHealth
                                                        ? 'Configure exemption, percentage rate (default 5%), and optional monthly cap. Employee share is 50% of the total.'
                                                        : `Configure exemption, fixed amount per payroll, and optional monthly cap for ${getContributionTypeLabel(version.type)}.`}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-sm text-muted-foreground">
                                                {exemptedCount} of {totalEmployees} employees exempted
                                            </div>
                                            <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                                                    style={{ width: `${totalEmployees > 0 ? (exemptedCount / totalEmployees) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => saveContributionSettings(version.id)}
                                            disabled={isSaving}
                                            className="gap-2 shadow-sm"
                                        >
                                            {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                            <Save className="h-4 w-4" />
                                            Save Settings
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </div>

                        <CardContent className="p-0">
                            {/* Bulk Actions Bar */}
                            <div className="p-3 border-b bg-muted/20 flex flex-wrap items-center gap-3">
                                <span className="text-sm font-medium text-muted-foreground">Bulk Actions:</span>

                                {/* Bulk Exempt Toggle */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAllExempted(!allExempted)}
                                    className="gap-1"
                                >
                                    {allExempted ? 'Enable All' : 'Exempt All'}
                                </Button>

                                {/* Bulk Fixed Amount - Available for ALL types including SSS */}
                                <div className="flex items-center gap-1">
                                    <span className="text-sm text-muted-foreground">Set Amount:</span>
                                    <div className="relative w-28">
                                        {!isPhilHealth && (
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₱</span>
                                        )}
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder={isPhilHealth ? "5.00" : "0.00"}
                                            className={`${!isPhilHealth ? 'pl-6' : 'pl-3'} h-8 text-sm ${allExempted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={allExempted}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !allExempted) {
                                                    const target = e.target as HTMLInputElement;
                                                    setAllFixedAmount(target.value);
                                                    target.value = '';
                                                }
                                            }}
                                        />
                                        {isPhilHealth && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">press Enter</span>
                                </div>

                                {/* Bulk Monthly Cap - Only for PhilHealth and Pag-IBIG, NOT for SSS */}
                                {!isSSS && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm text-muted-foreground">Set Cap:</span>
                                        <div className="relative w-28">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₱</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="No cap"
                                                className={`pl-6 h-8 text-sm ${allExempted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={allExempted}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !allExempted) {
                                                        const target = e.target as HTMLInputElement;
                                                        setAllMonthlyCap(target.value);
                                                        target.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground">press Enter</span>
                                    </div>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="font-semibold">Employee Name</TableHead>
                                            <TableHead className="w-24 text-center font-semibold">Exempted</TableHead>
                                            {!isSSS && (
                                                <>
                                                    <TableHead className="w-44 font-semibold">
                                                        {isPhilHealth ? 'Rate (%)' : 'Fixed Amount (per payroll)'}
                                                    </TableHead>
                                                    <TableHead className="w-44 font-semibold">Monthly Cap</TableHead>
                                                </>
                                            )}
                                            {isSSS && (
                                                <TableHead className="w-56 font-semibold">Fixed Amount (per payroll)</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {employees.map((employee) => {
                                            const setting = settingsForVersion[employee.id] || {
                                                employee_id: employee.id,
                                                contribution_version_id: version.id,
                                                is_exempted: false,
                                                fixed_amount: null,
                                                monthly_cap: null,
                                            };

                                            return (
                                                <TableRow key={employee.id} className="hover:bg-muted/30 transition-colors duration-150">
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                                <span className="text-xs font-semibold text-primary">
                                                                    {employee.user?.name?.charAt(0).toUpperCase() || 'E'}
                                                                </span>
                                                            </div>
                                                            <span>{employee.user?.name || `Employee #${employee.id}`}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Switch
                                                            checked={setting.is_exempted || false}
                                                            onCheckedChange={(checked) =>
                                                                updateEmployeeSetting(version.id, employee.id, 'is_exempted', checked)
                                                            }
                                                            className="data-[state=checked]:bg-green-500"
                                                        />
                                                    </TableCell>
                                                    {!isSSS && (
                                                        <>
                                                            <TableCell>
                                                                <div className="relative">
                                                                    {isPhilHealth ? (
                                                                        <>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.01"
                                                                                placeholder="5.00"
                                                                                value={setting.fixed_amount || ''}
                                                                                onChange={(e) =>
                                                                                    updateEmployeeSetting(version.id, employee.id, 'fixed_amount', e.target.value)
                                                                                }
                                                                                disabled={setting.is_exempted}
                                                                                className={`pl-3 pr-8 ${setting.is_exempted ? 'bg-muted/50' : ''}`}
                                                                            />
                                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
                                                                            <Input
                                                                                type="number"
                                                                                step="0.01"
                                                                                placeholder="0.00"
                                                                                value={setting.fixed_amount || ''}
                                                                                onChange={(e) =>
                                                                                    updateEmployeeSetting(version.id, employee.id, 'fixed_amount', e.target.value)
                                                                                }
                                                                                disabled={setting.is_exempted}
                                                                                className={`pl-7 ${setting.is_exempted ? 'bg-muted/50' : ''}`}
                                                                            />
                                                                        </>
                                                                    )}
                                                                </div>
                                                                {isPhilHealth && (
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        Default: 5% (2.5% employee, 2.5% employer)
                                                                    </p>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        placeholder="No cap"
                                                                        value={setting.monthly_cap || ''}
                                                                        onChange={(e) =>
                                                                            updateEmployeeSetting(version.id, employee.id, 'monthly_cap', e.target.value)
                                                                        }
                                                                        disabled={setting.is_exempted}
                                                                        className={`pl-7 ${setting.is_exempted ? 'bg-muted/50' : ''}`}
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                        </>
                                                    )}
                                                    {isSSS && (
                                                        <TableCell>
                                                            {setting.is_exempted ? (
                                                                <div className="text-muted-foreground text-sm italic">Exempted</div>
                                                            ) : (
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        placeholder="Enter amount"
                                                                        value={setting.fixed_amount || ''}
                                                                        onChange={(e) => {
                                                                            updateEmployeeSetting(version.id, employee.id, 'fixed_amount', e.target.value);
                                                                        }}
                                                                        disabled={setting.is_exempted}
                                                                        className={`pl-7 ${setting.is_exempted ? 'bg-muted/50' : ''}`}
                                                                    />
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                );
            })
        )}
    </div>
</TabsContent>
</Tabs>

                <DeleteConfirmationDialog
                    isOpen={deleteDialogOpen}
                    onClose={() => {
                        setDeleteDialogOpen(false);
                        setItemToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                    title='Delete Contribution Item'
                    itemName={itemToDelete ? getContributionTypeLabel(itemToDelete.type) : ''}
                    isLoading={isDeleting}
                    confirmText='Delete Contribution'
                />
            </div>

            {/* Create Modal */}
            <CreateContributionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                existingTypes={existingTypes}
            />

            {/* Edit Modal */}
            {editingVersion && (
                <EditContributionModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingVersion(null);
                    }}
                    contributionVersion={editingVersion}
                    existingTypes={existingTypes.filter(type => type !== editingVersion.type)}
                />
            )}

            {/* Brackets Modal */}
            <Dialog open={isBracketsModalOpen} onOpenChange={setIsBracketsModalOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            Contribution Brackets - {selectedVersion && getContributionTypeLabel(selectedVersion.type)}
                        </DialogTitle>
                        <DialogDescription>
                            View salary brackets and contribution amounts/percentages for this contribution type.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        {selectedVersion?.contribution_brackets && selectedVersion.contribution_brackets.length > 0 ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Salary Range</TableHead>
                                            <TableHead className="text-right">
                                                {selectedVersion.type === 'sss' ? 'Employee Share (₱)' : 'Employee Share (%)'}
                                            </TableHead>
                                            <TableHead className="text-right">
                                                {selectedVersion.type === 'sss' ? 'Employer Share (₱)' : 'Employer Share (%)'}
                                            </TableHead>
                                            {selectedVersion.type === 'sss' && (
                                                <TableHead className="text-right">Total (₱)</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedVersion.contribution_brackets.map((bracket) => (
                                            <TableRow key={bracket.id}>
                                                <TableCell className="font-medium">
                                                    ₱{Number(bracket.salary_from).toLocaleString()} -
                                                    {bracket.salary_to
                                                        ? ` ₱${Number(bracket.salary_to).toLocaleString()}`
                                                        : ' Above'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {selectedVersion.type === 'sss'
                                                        ? `₱${Number(bracket.employee_share).toLocaleString()}`
                                                        : `${Number(bracket.employee_share)}%`}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {selectedVersion.type === 'sss'
                                                        ? `₱${Number(bracket.employer_share).toLocaleString()}`
                                                        : `${Number(bracket.employer_share)}%`}
                                                </TableCell>
                                                {selectedVersion.type === 'sss' && (
                                                    <TableCell className="text-right font-semibold">
                                                        ₱{(Number(bracket.employee_share) + Number(bracket.employer_share)).toLocaleString()}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
                                <Percent className="h-8 w-8 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No brackets configured for this version</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Details Modal */}
            <CustomModalView
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                title={ContributionModalConfig.title}
                description={ContributionModalConfig.description}
                fields={ContributionModalConfig.fields}
                data={selectedVersion}
                headerIcon={<Percent className="h-6 w-6 text-primary" />}
            />
        </AppLayout>
    );
}

// =============================================================================
// CREATE MODAL COMPONENT
// =============================================================================

interface CreateContributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingTypes: string[];
}

function CreateContributionModal({ isOpen, onClose, existingTypes }: CreateContributionModalProps) {
    const { data, setData, errors, processing, post, reset } = useForm<FormData>({
        type: '',
        salary_ranges: [{
            salary_from: '',
            salary_to: '',
            employee_share: '',
            employer_share: '',
        }],
    });

    const handleClose = () => {
        reset();
        onClose();
    };

    function submitContributionVersion(e: React.FormEvent) {
        e.preventDefault();
        post(route('contribution-versions.store'), {
            onSuccess: (page) => {
                const successMessage = page.props.flash?.success || 'Contribution version created successfully.';
                toast.success(successMessage);
                handleClose();
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to create contribution version.';
                toast.error(errorMessage);
            }
        });
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

    const getNestedError = (index: number, field: string) => {
        return errors[`salary_ranges.${index}.${field}`];
    };

    const allTypesTaken = existingTypes.length >= 3;
    const isSSS = data.type === 'sss';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Create Contribution Version</DialogTitle>
                    <DialogDescription>
                        Create a new contribution version with salary ranges and contribution percentages.
                    </DialogDescription>
                </DialogHeader>

                {allTypesTaken ? (
                    <div className="py-8 text-center">
                        <p className="text-muted-foreground mb-4">
                            All contribution types (SSS, PhilHealth, Pag-IBIG) already have versions.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            You can only have one version per contribution type. Please edit or delete existing versions if you need to make changes.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={submitContributionVersion} className="space-y-6">
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
                                    {!existingTypes.includes('sss') && (
                                        <SelectItem value="sss">SSS</SelectItem>
                                    )}
                                    {!existingTypes.includes('philhealth') && (
                                        <SelectItem value="philhealth">PhilHealth</SelectItem>
                                    )}
                                    {!existingTypes.includes('pagibig') && (
                                        <SelectItem value="pagibig">Pag-IBIG</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            {existingTypes.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Available types: {['sss', 'philhealth', 'pagibig']
                                        .filter(type => !existingTypes.includes(type))
                                        .map(type => getContributionTypeLabel(type))
                                        .join(', ')}
                                </p>
                            )}
                            <InputError message={errors.type} />
                        </div>

                        {isSSS && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Salary Ranges & Contributions</label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addSalaryRange}
                                        className='hover:cursor-pointer'
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Range
                                    </Button>
                                </div>

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
                                                <InputError message={getNestedError(index, 'employer_share')} />
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-muted-foreground">
                                            <p>Enter contribution percentage (e.g., 10 for 10%)</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                className='hover:cursor-pointer'
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className='hover:cursor-pointer'
                            >
                                {processing && <LoaderCircle className='h-4 w-4 animate-spin mr-2' />}
                                {processing ? 'Creating...' : 'Create Contribution Version'}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

// =============================================================================
// EDIT MODAL COMPONENT
// =============================================================================

interface EditContributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    contributionVersion: ContributionVersion;
    existingTypes: string[];
}

function EditContributionModal({ isOpen, onClose, contributionVersion, existingTypes }: EditContributionModalProps) {
    const initialSalaryRanges = contributionVersion.contribution_brackets.map(bracket => ({
        salary_from: bracket.salary_from.toString(),
        salary_to: bracket.salary_to.toString(),
        employee_share: bracket.employee_share.toString(),
        employer_share: bracket.employer_share.toString(),
    }));

    const { data, setData, errors, processing, put, reset } = useForm<FormData>({
        type: contributionVersion.type || '',
        salary_ranges: initialSalaryRanges.length > 0 ? initialSalaryRanges : [{
            salary_from: '',
            salary_to: '',
            employee_share: '',
            employer_share: '',
        }],
    });

    const handleClose = () => {
        reset();
        onClose();
    };

    function submitContributionVersion(e: React.FormEvent) {
        e.preventDefault();
        put(route('contribution-versions.update', { contribution_version: contributionVersion.id }), {
            onSuccess: (page) => {
                const successMessage = page.props.flash?.success || 'Contribution version updated successfully.';
                toast.success(successMessage);
                handleClose();
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to update contribution version.';
                toast.error(errorMessage);
            }
        });
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

    const getNestedError = (index: number, field: string) => {
        return errors[`salary_ranges.${index}.${field}`];
    };

    const isSSS = data.type === 'sss';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Edit Contribution Version</DialogTitle>
                    <DialogDescription>
                        Update contribution version details and salary ranges.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submitContributionVersion} className="space-y-6">
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
                                <SelectItem value={contributionVersion.type}>
                                    {getContributionTypeLabel(contributionVersion.type)}
                                </SelectItem>
                                {!existingTypes.includes('sss') && contributionVersion.type !== 'sss' && (
                                    <SelectItem value="sss">SSS</SelectItem>
                                )}
                                {!existingTypes.includes('philhealth') && contributionVersion.type !== 'philhealth' && (
                                    <SelectItem value="philhealth">PhilHealth</SelectItem>
                                )}
                                {!existingTypes.includes('pagibig') && contributionVersion.type !== 'pagibig' && (
                                    <SelectItem value="pagibig">Pag-IBIG</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.type} />
                    </div>

                    {isSSS && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Salary Ranges & Contributions</label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addSalaryRange}
                                    className='hover:cursor-pointer'
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Range
                                </Button>
                            </div>

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
                                            <InputError message={getNestedError(index, 'employer_share')} />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        <p>Enter contribution percentage (e.g., 10 for 10%)</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className='hover:cursor-pointer'
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className='hover:cursor-pointer'
                        >
                            {processing && <LoaderCircle className='h-4 w-4 animate-spin mr-2' />}
                            {processing ? 'Updating...' : 'Update Contribution Version'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
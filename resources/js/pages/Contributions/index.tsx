import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { format, isToday } from 'date-fns';
import { Calculator, Percent, Plus, Trash2, LoaderCircle, Filter, Handshake, Users, Settings, Save, Shield, Heart, Search, HeartPulse, HandHeart } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';

import { CustomHeader } from '@/components/custom-header';
import { CustomModalView } from '@/components/custom-modal-view';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomTable } from '@/components/custom-table';
// import { CustomToast, toast } from '@/components/custom-toast';
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
import { EmployeeFilterBar, type BranchData } from '@/components/employee/employee-filter-bar';
import { toast } from 'sonner';
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

// Custom toast style helper
const toastStyle = (color: string) => ({
    style: {
        backgroundColor: 'white',
        color: color,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
});

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
    const { props } = usePage<{ flash?: { success?: string; error?: string; warning?: string; info?: string } }>();
    const [selectedVersion, setSelectedVersion] = useState<ContributionVersion | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBracketsModalOpen, setIsBracketsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingVersion, setEditingVersion] = useState<ContributionVersion | null>(null);

    // Filter states for contribution versions (type filter)
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
    const [savingSettings, setSavingSettings] = useState<Record<number, boolean>>({});
    const [employeesDataLoaded, setEmployeesDataLoaded] = useState(false);

    // Per‑version pagination state for employee tables
    const [employeePagination, setEmployeePagination] = useState<Record<number, { page: number; perPage: number }>>({});

    // Employee settings sub-tab
    const [employeeSettingsTab, setEmployeeSettingsTab] = useState<'sss' | 'philhealth' | 'pagibig'>('sss');

    // Search terms for each contribution type (only filter)
    const [sssSearchTerm, setSssSearchTerm] = useState('');
    const [philhealthSearchTerm, setPhilhealthSearchTerm] = useState('');
    const [pagibigSearchTerm, setPagibigSearchTerm] = useState('');

    // Track last shown flash to prevent duplicates within a short time window
    const lastFlashRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

    // Flash message listener – prevents duplicate toasts within 500ms
    useEffect(() => {
        const flash = props.flash;
        if (!flash) return;

        const flashKey = JSON.stringify(flash);
        const now = Date.now();
        const last = lastFlashRef.current;

        // If same flash key appeared within last 500ms, skip (prevents double toast)
        if (last.key === flashKey && (now - last.time) < 500) {
            return;
        }

        // Update ref
        lastFlashRef.current = { key: flashKey, time: now };

        if (flash.success) {
            toast.success(flash.success, toastStyle('#16a34a')); // green text
        }
        if (flash.error) {
            toast.error(flash.error, toastStyle('#dc2626')); // red text (danger)
        }
        if (flash.warning) {
            toast.warning(flash.warning, toastStyle('#f97316')); // orange text (warning)
        }
        if (flash.info) {
            toast.info(flash.info, toastStyle('#3b82f6')); // blue text (info)
        }
    }, [props.flash]);

    // Helper to get or initialize pagination for a version
    const getVersionPagination = (versionId: number) => {
        return employeePagination[versionId] ?? { page: 1, perPage: 10 };
    };

    const updateVersionPagination = (versionId: number, updates: Partial<{ page: number; perPage: number }>) => {
        setEmployeePagination(prev => ({
            ...prev,
            [versionId]: { ...getVersionPagination(versionId), ...updates }
        }));
    };

    // Helper to generate client-side pagination links for CustomPagination
    const generateClientLinks = (currentPage: number, lastPage: number) => {
        const links = [];
        links.push({
            active: false,
            label: 'Previous',
            url: currentPage > 1 ? '#' : null
        });
        for (let i = 1; i <= lastPage; i++) {
            links.push({
                active: i === currentPage,
                label: String(i),
                url: '#'
            });
        }
        links.push({
            active: false,
            label: 'Next',
            url: currentPage < lastPage ? '#' : null
        });
        return links;
    };

    const handleDeleteClick = (contributionVersion: ContributionVersion) => {
        setItemToDelete(contributionVersion);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        destroy(route('contribution-versions.destroy', { contribution_version: itemToDelete.id }), {
            onSuccess: () => {
                // Flash message will be shown by global useEffect
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete contribution version.';
                toast.error(errorMessage, toastStyle('#dc2626'));
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

    // Filtered contribution versions based on type filter
    const displayData = useMemo(() => {
        if (!typeFilter || typeFilter === 'all') {
            return versions;
        }
        return versions.filter(version => version.type === typeFilter);
    }, [versions, typeFilter]);

    useEffect(() => {
        setHasActiveFilters(!!typeFilter && typeFilter !== 'all');
    }, [typeFilter]);

    const existingTypes = useMemo(() => {
        return versions.map(version => version.type);
    }, [versions]);

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

    // Fetch employees and their settings (no loading state)
    const fetchEmployeesAndSettings = async () => {
        if (!hasRecords) return;

        try {
            const employeesResponse = await fetch('/employees/list');
            const employeesData = await employeesResponse.json();

            let employeesList: Employee[] = [];
            if (employeesData.data && Array.isArray(employeesData.data)) {
                employeesList = employeesData.data;
            } else if (Array.isArray(employeesData)) {
                employeesList = employeesData;
            } else {
                employeesList = [];
            }
            setEmployees(employeesList);

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
            setOriginalEmployeeSettings(JSON.parse(JSON.stringify(settingsMap)));
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            toast.error('Failed to load employees');
        }
    };

    // Reset loaded flag when versions change
    useEffect(() => {
        setEmployeesDataLoaded(false);
    }, [versions]);

    // Fetch employees & settings immediately when versions exist (no tab dependency)
    useEffect(() => {
        if (hasRecords && !employeesDataLoaded) {
            fetchEmployeesAndSettings().then(() => setEmployeesDataLoaded(true));
        }
    }, [hasRecords, employeesDataLoaded]);

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

        const changedSettings = [];
        const allEmployeeIds = new Set([...Object.keys(currentSettings), ...Object.keys(originalSettings)]);

        for (const employeeId of allEmployeeIds) {
            const current = currentSettings[Number(employeeId)];
            const original = originalSettings[Number(employeeId)];

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

        if (changedSettings.length === 0) {
            toast.info('No changes to save', toastStyle('#3b82f6'));
            return;
        }

        setSavingSettings(prev => ({ ...prev, [contributionVersionId]: true }));

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
                    toast.success(`${data.message || 'Settings saved successfully!'} (${changedSettings.length} employee${changedSettings.length > 1 ? 's' : ''} updated)`, toastStyle('#16a34a'));
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
                    toast.error(data.message || 'Failed to save settings', toastStyle('#dc2626'));
                }
            })
            .catch(error => {
                console.error('Save error:', error);
                toast.error('An error occurred while saving', toastStyle('#dc2626'));
            })
            .finally(() => {
                setSavingSettings(prev => ({ ...prev, [contributionVersionId]: false }));
            });
    };

    // Helper: get version by type
    const versionByType = useMemo(() => {
        const map: Record<string, ContributionVersion | undefined> = {};
        versions.forEach(v => { map[v.type] = v; });
        return map;
    }, [versions]);

    // Helper: filter employees by search term (name or ID)
    const filterEmployeesBySearch = (employeesList: Employee[], searchTerm: string) => {
        if (!searchTerm.trim()) return employeesList;
        const term = searchTerm.toLowerCase();
        return employeesList.filter(emp =>
            emp.user?.name?.toLowerCase().includes(term) ||
            emp.id.toString().includes(term)
        );
    };

    // Reset pagination for a specific version
    const resetPaginationForVersion = (versionId: number) => {
        updateVersionPagination(versionId, { page: 1 });
    };

    // =========================================================================
    // renderContributionCard – uses CustomTable + CustomPagination
    // =========================================================================
    const renderContributionCard = (
        type: 'sss' | 'philhealth' | 'pagibig',
        searchTerm: string,
        setSearchTerm: (value: string) => void
    ) => {
        const version = versionByType[type];
        if (!version) {
            return (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="rounded-full bg-muted p-4 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                            <Percent className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium">No {getContributionTypeLabel(type)} version configured</p>
                        <p className="text-sm text-muted-foreground mt-1">Please create a {getContributionTypeLabel(type)} contribution version first.</p>
                    </CardContent>
                </Card>
            );
        }

        const versionId = version.id;
        const settingsForVersion = employeeSettings[versionId] || {};
        const isSaving = savingSettings[versionId] || false;
        const isPhilHealth = type === 'philhealth';
        const isSSS = type === 'sss';

        const filteredEmployeesList = filterEmployeesBySearch(employees, searchTerm);
        const totalEmployees = filteredEmployeesList.length;
        const exemptedCount = Object.values(settingsForVersion).filter(
            s => s.is_exempted && filteredEmployeesList.some(emp => emp.id === s.employee_id)
        ).length;
        const allExempted = totalEmployees > 0 && exemptedCount === totalEmployees;

        const { page: currentPage, perPage: currentPerPage } = getVersionPagination(versionId);
        const startIndex = (currentPage - 1) * currentPerPage;
        const paginatedEmployees = filteredEmployeesList.slice(startIndex, startIndex + currentPerPage);
        const lastPage = Math.ceil(totalEmployees / currentPerPage);
        const clientPagination = {
            links: generateClientLinks(currentPage, lastPage),
            from: totalEmployees === 0 ? 0 : startIndex + 1,
            to: Math.min(startIndex + currentPerPage, totalEmployees),
            total: totalEmployees,
            current_page: currentPage,
            last_page: lastPage,
            per_page: currentPerPage,
        };

        const setAllExempted = (exempted: boolean) => {
            employees.forEach((employee) => {
                updateEmployeeSetting(versionId, employee.id, 'is_exempted', exempted);
            });
            toast.success(`All employees ${exempted ? 'exempted from' : 'enabled for'} ${getContributionTypeLabel(type)}`, toastStyle('#16a34a'));
        };

        const setAllFixedAmount = (amount: string) => {
            if (!allExempted) {
                employees.forEach((employee) => {
                    const currentSetting = settingsForVersion[employee.id] || {};
                    if (!currentSetting.is_exempted) {
                        updateEmployeeSetting(versionId, employee.id, 'fixed_amount', amount);
                    }
                });
                toast.success(`Fixed amount set to ${isPhilHealth ? amount + '%' : '₱' + amount} for all non-exempted employees`, toastStyle('#16a34a'));
            }
        };

        const employeeColumns = [
            {
                label: 'Employee Name',
                key: 'name',
                className: 'w-[250px] min-w-[200px]',
                render: (row: any) => (
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                                {row.user?.name?.charAt(0).toUpperCase() || 'E'}
                            </span>
                        </div>
                        <span className="truncate">{row.user?.name || `Employee #${row.id}`}</span>
                    </div>
                ),
            },
            {
                label: 'Exempted',
                key: 'exempted',
                className: 'w-24 text-center',
                render: (row: any) => {
                    const setting = settingsForVersion[row.id] || {
                        employee_id: row.id,
                        contribution_version_id: versionId,
                        is_exempted: false,
                        fixed_amount: null,
                        monthly_cap: null,
                    };
                    return (
                        <div className="flex justify-center">
                            <Switch
                                checked={setting.is_exempted || false}
                                onCheckedChange={(checked) =>
                                    updateEmployeeSetting(versionId, row.id, 'is_exempted', checked)
                                }
                                className="data-[state=checked]:bg-green-500"
                            />
                        </div>
                    );
                },
            },
            {
                label: isPhilHealth ? 'Rate (%)' : (isSSS ? 'Fixed Amount (per payroll)' : 'Fixed Amount (per payroll)'),
                key: 'amount',
                className: 'w-[200px] min-w-[180px]',
                render: (row: any) => {
                    const setting = settingsForVersion[row.id] || {
                        employee_id: row.id,
                        contribution_version_id: versionId,
                        is_exempted: false,
                        fixed_amount: null,
                        monthly_cap: null,
                    };
                    if (setting.is_exempted) {
                        return <div className="text-muted-foreground text-sm italic">Exempted</div>;
                    }
                    return (
                        <div className="relative max-w-[180px]">
                            {!isPhilHealth && (
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
                            )}
                            <Input
                                type="number"
                                step="0.01"
                                placeholder={isPhilHealth ? "5.00" : "0.00"}
                                value={setting.fixed_amount || ''}
                                onChange={(e) =>
                                    updateEmployeeSetting(versionId, row.id, 'fixed_amount', e.target.value)
                                }
                                className={`${!isPhilHealth ? 'pl-7' : 'pl-3'} ${setting.is_exempted ? 'bg-muted/50' : ''}`}
                            />
                            {isPhilHealth && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                            )}
                        </div>
                    );
                },
            },
        ];

        const toolbarContent = (
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
                <div className="flex-1 min-w-[250px]">
                    <EmployeeFilterBar
                        filters={{
                            search: true,
                            position: false,
                            branch: false,
                            site: false,
                            date: false,
                            status: false,
                        }}
                        allPositions={[]}
                        branchesData={[]}
                        searchTerm={searchTerm}
                        selectedPositions={[]}
                        selectedBranch=""
                        selectedSite=""
                        status=""
                        dateFrom={undefined}
                        dateTo={undefined}
                        onSearchChange={(val) => {
                            setSearchTerm(val);
                            resetPaginationForVersion(versionId);
                        }}
                        onPositionsChange={() => { }}
                        onBranchChange={() => { }}
                        onSiteChange={() => { }}
                        onStatusChange={() => { }}
                        onDateFromChange={() => { }}
                        onDateToChange={() => { }}
                        // onClearAll={() => {
                        //     setSearchTerm('');
                        //     resetPaginationForVersion(versionId);
                        // }}
                        searchPlaceholder="Search by name or ID..."
                        dateLabel="Hire Date"
                    />
                </div>

                <div className="w-px h-6 bg-border hidden lg:block" />

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllExempted(!allExempted)}
                    className="gap-1 shrink-0"
                >
                    {allExempted ? 'Enable All' : 'Exempt All'}
                </Button>

                <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Set Amount:</span>
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
                </div>

                <div className="flex-1" />

                <Button
                    size="sm"
                    onClick={() => saveContributionSettings(versionId)}
                    disabled={isSaving}
                    className="gap-2 shadow-sm shrink-0"
                >
                    {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4" />
                    Save Settings
                </Button>
            </div>
        );

        const tableTitle = `${getContributionTypeLabel(type)} Employee Settings`;
        const handlePerPageChange = (value: string) => {
            updateVersionPagination(versionId, { perPage: parseInt(value, 10), page: 1 });
        };
        const handlePageChange = (page: number) => {
            updateVersionPagination(versionId, { page });
        };

        return (
            <div className="space-y-4">
                <CustomTable
                    columns={employeeColumns}
                    actions={[]}
                    data={paginatedEmployees}
                    from={clientPagination.from}
                    to={clientPagination.to}
                    total={totalEmployees}
                    filteredCount={totalEmployees}
                    totalCount={totalEmployees}
                    searchTerm={searchTerm}
                    onDelete={() => { }}
                    onView={() => { }}
                    onEdit={() => { }}
                    title={tableTitle}
                    toolbar={toolbarContent}
                    selectable={false}
                />
                {totalEmployees > 0 && (
                    <div className="bg-muted/10 px-4 py-3 rounded-b-2xl">
                        <CustomPagination
                            pagination={clientPagination}
                            perPage={String(currentPerPage)}
                            onPerPageChange={handlePerPageChange}
                            onPageChange={handlePageChange}
                            totalCount={totalEmployees}
                            filteredCount={totalEmployees}
                            search={searchTerm}
                            resourceName="employee"
                        />
                    </div>
                )}
            </div>
        );
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

            {/* <CustomToast /> */}
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
                        <TabsTrigger value="versions" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:cursor-default data-[state=active]:text-primary-foreground rounded-lg transition-all cursor-pointer">
                            <Percent className="h-4 w-4" />
                            Contribution Versions
                        </TabsTrigger>
                        <TabsTrigger value="employee-settings" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:cursor-default data-[state=active]:text-primary-foreground rounded-lg transition-all cursor-pointer">
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
                                                <Button variant="outline" onClick={() => setTypeFilter("")}>
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
                                    <CustomPagination
                                        className="pp-row"
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

                    {/* Tab 2: Employee Settings – data is preloaded, so no empty state flash */}
                    <TabsContent value="employee-settings">
                        <div className="space-y-6">
                            {employees.length === 0 ? (
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
                                <Tabs value={employeeSettingsTab} onValueChange={(v) => setEmployeeSettingsTab(v as any)} className="space-y-4">
                                    <TabsList className="grid w-full max-w-md grid-cols-3">
                                        <TabsTrigger value="sss" className='flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:cursor-default data-[state=active]:text-primary-foreground rounded-lg transition-all cursor-pointer'> <Shield className="h-4 w-4" />SSS</TabsTrigger>
                                        <TabsTrigger value="philhealth" className='flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:cursor-default data-[state=active]:text-primary-foreground rounded-lg transition-all cursor-pointer'> <HeartPulse className="h-4 w-4" />PhilHealth</TabsTrigger>
                                        <TabsTrigger value="pagibig" className='flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:cursor-default data-[state=active]:text-primary-foreground rounded-lg transition-all cursor-pointer'> <HandHeart className="h-4 w-4" />Pag-IBIG</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="sss">
                                        {renderContributionCard('sss', sssSearchTerm, setSssSearchTerm)}
                                    </TabsContent>
                                    <TabsContent value="philhealth">
                                        {renderContributionCard('philhealth', philhealthSearchTerm, setPhilhealthSearchTerm)}
                                    </TabsContent>
                                    <TabsContent value="pagibig">
                                        {renderContributionCard('pagibig', pagibigSearchTerm, setPagibigSearchTerm)}
                                    </TabsContent>
                                </Tabs>
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
// CREATE MODAL COMPONENT (fixed - removed duplicate flash listener)
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
            onSuccess: () => {
                handleClose();
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to create contribution version.';
                toast.error(errorMessage, toastStyle('#dc2626'));
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
// EDIT MODAL COMPONENT (fixed - removed duplicate flash listener)
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
            onSuccess: () => {
                handleClose();
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to update contribution version.';
                toast.error(errorMessage, toastStyle('#dc2626'));
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
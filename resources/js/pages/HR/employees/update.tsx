import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { Search, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { update } from '@/actions/App/Http/Controllers/HrRole/HREmployeeController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import HrLayout from '@/layouts/hr-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
    {
        title: 'Edit',
        href: '/employees/edit',
    },
];

interface Props {
    positions: any[];
    branches: any[];
    employee: any;
    site: any[];
}

export default function Update({ positions, branches, employee, site = [] }: Props) {
    const [availableSites, setAvailableSites] = useState<any[]>([]);
    const [positionSearch, setPositionSearch] = useState('');
    const [showPositionDropdown, setShowPositionDropdown] = useState(false);
    const [siteSearch, setSiteSearch] = useState('');
    const [showSiteDropdown, setShowSiteDropdown] = useState(false);
    const [branchSearch, setBranchSearch] = useState('');
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);

    // Helper function to format date for input field (YYYY-MM-DD)
    const formatDateForInput = (dateString: string | null | undefined) => {
        if (!dateString) return '';
        
        // If it's already in YYYY-MM-DD format, return as is
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateString;
        }
        
        // Otherwise try to parse and format
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return '';
        }
    };

    const getStatusFromDates = (start: string, end: string) => {
        if (!start || !end) return 'Inactive';
        
        const today = new Date();
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        today.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        return (today >= startDate && today <= endDate) ? 'Active' : 'Inactive';
    };

    const { data, setData, put, processing, errors } = useForm({
        name: employee.user?.name || '',
        email: employee.user?.email || '',
        password: '',
        position_id: employee.position_id?.toString() || '',
        branch_id: employee.branch_id?.toString() || '',
        site_id: employee.site_id?.toString() || '',
        emp_code: employee.emp_code || '',
        contract_start_date: formatDateForInput(employee.contract_start_date),
        contract_end_date: formatDateForInput(employee.contract_end_date),
        pay_frequency: employee.pay_frequency || '',
        employee_number: employee.employee_number || '',
        emergency_contact_number: employee.emergency_contact_number || '',
        employee_status: employee.employee_status || 'Inactive',
    });

    // Update status when dates change
    useEffect(() => {
        if (data.contract_start_date && data.contract_end_date) {
            const status = getStatusFromDates(data.contract_start_date, data.contract_end_date);
            setData('employee_status', status);
        } else {
            setData('employee_status', 'Inactive');
        }
    }, [data.contract_start_date, data.contract_end_date]);

    // Initialize position search
    useEffect(() => {
        const selectedPos = positions?.find(p => p.id === parseInt(data.position_id));
        if (selectedPos) {
            setPositionSearch(selectedPos.pos_name);
        }
    }, []);

    // Initialize branch search
    useEffect(() => {
        const selectedBranch = branches?.find(b => b.id === parseInt(data.branch_id));
        if (selectedBranch) {
            setBranchSearch(selectedBranch.branch_name);
        }
    }, []);

    // Update available sites when branch changes
    useEffect(() => {
        if (!data.branch_id) {
            setAvailableSites([]);
            setSiteSearch('');
            return;
        }

        const filteredSites = site.filter(s => s.branch_id === parseInt(data.branch_id));
        setAvailableSites(filteredSites);

        if (data.site_id) {
            const selectedSite = filteredSites.find(s => s.id === parseInt(data.site_id));
            if (selectedSite) {
                setSiteSearch(selectedSite.site_name || selectedSite.name);
            }
        } else {
            setSiteSearch('');
        }
    }, [data.branch_id, data.site_id]);

    // Filter positions based on search, limit to 5
    const filteredPositions = positions
        ?.filter(position =>
            position.pos_name.toLowerCase().includes(positionSearch.toLowerCase())
        )
        .slice(0, 5);

    // Filter branches based on search, limit to 5
    const filteredBranches = branches
        ?.filter(branch =>
            branch.branch_name.toLowerCase().includes(branchSearch.toLowerCase())
        )
        .slice(0, 5);

    // Filter sites based on search, limit to 5
    const filteredSites = availableSites
        ?.filter(site => {
            const siteName = site.site_name || site.name || '';
            return siteName.toLowerCase().includes(siteSearch.toLowerCase());
        })
        .slice(0, 5);

    const selectedPosition = positions?.find(p => p.id === parseInt(data.position_id));
    const selectedBranch = branches?.find(b => b.id === parseInt(data.branch_id));
    const selectedSite = availableSites?.find(s => s.id === parseInt(data.site_id));

    const handlePhoneChange = (field: 'employee_number' | 'emergency_contact_number', value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 10);
        setData(field, digits ? `+63${digits}` : '');
    };

    const getDisplayValue = (field: 'employee_number' | 'emergency_contact_number') => {
        return data[field] ? data[field].replace('+63', '') : '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(update(employee.slug_emp).url);
    };

    const selectPosition = (positionId: string, positionName: string) => {
        setData('position_id', positionId);
        setPositionSearch(positionName);
        setShowPositionDropdown(false);
    };

    const selectBranch = (branchId: string, branchName: string) => {
        setData('branch_id', branchId);
        setBranchSearch(branchName);
        setShowBranchDropdown(false);
        setData('site_id', '');
        setSiteSearch('');
    };

    const selectSite = (siteId: string, siteName: string) => {
        setData('site_id', siteId);
        setSiteSearch(siteName);
        setShowSiteDropdown(false);
    };

    // Debug: Log the dates to see what's being loaded
    console.log('Employee dates:', {
        original_start: employee.contract_start_date,
        original_end: employee.contract_end_date,
        formatted_start: formatDateForInput(employee.contract_start_date),
        formatted_end: formatDateForInput(employee.contract_end_date),
        data_start: data.contract_start_date,
        data_end: data.contract_end_date
    });

    return (
        <HrLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Employee" />
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Edit Employee</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">User Details</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="emp_code">Employee Code <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="emp_code" 
                                        value={data.emp_code} 
                                        onChange={e => setData('emp_code', e.target.value)} 
                                        className="w-full" 
                                        placeholder="Enter employee code" 
                                    />
                                    <InputError message={errors.emp_code} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="name" 
                                        value={data.name} 
                                        onChange={e => setData('name', e.target.value)} 
                                        className="w-full" 
                                        placeholder="Enter full name" 
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        value={data.email} 
                                        onChange={e => setData('email', e.target.value)} 
                                        className="w-full" 
                                        placeholder="Enter email address" 
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input 
                                        id="password" 
                                        type="password" 
                                        value={data.password} 
                                        onChange={e => setData('password', e.target.value)} 
                                        className="w-full" 
                                        placeholder="Leave blank to keep current" 
                                    />
                                    <p className="text-xs text-gray-500">Leave empty if no change</p>
                                    <InputError message={errors.password} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">Employee Details</h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="employee_number">Contact Number <span className="text-red-500">*</span></Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+63</span>
                                        <Input 
                                            id="employee_number" 
                                            type="text" 
                                            value={getDisplayValue('employee_number')} 
                                            onChange={e => handlePhoneChange('employee_number', e.target.value)} 
                                            className="w-full rounded-l-none" 
                                            placeholder="XXX XXX XXXX" 
                                            maxLength={10} 
                                        />
                                    </div>
                                    <InputError message={errors.employee_number} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="position_id">Position <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div 
                                            className="flex items-center border border-input rounded-md cursor-pointer" 
                                            onClick={() => setShowPositionDropdown(!showPositionDropdown)}
                                        >
                                            <div className="flex-1 px-3 py-2 text-sm">
                                                {selectedPosition?.pos_name || 'Select a Position'}
                                            </div>
                                            <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                                        </div>
                                        {showPositionDropdown && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-input rounded-md shadow-lg">
                                                <div className="p-2 border-b">
                                                    <div className="relative">
                                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input 
                                                            value={positionSearch} 
                                                            onChange={(e) => setPositionSearch(e.target.value)} 
                                                            placeholder="Search positions..." 
                                                            className="pl-8" 
                                                            autoFocus 
                                                            onClick={(e) => e.stopPropagation()} 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-60 overflow-auto">
                                                    {filteredPositions.length > 0 ? (
                                                        filteredPositions.map((position) => (
                                                            <div 
                                                                key={position.id} 
                                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm" 
                                                                onClick={() => selectPosition(position.id.toString(), position.pos_name)}
                                                            >
                                                                {position.pos_name}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-sm text-gray-500">No positions found</div>
                                                    )}
                                                    {filteredPositions.length === 5 && positions.length > 5 && (
                                                        <div className="px-3 py-2 text-xs text-gray-400 border-t">Showing top 5 results</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <InputError message={errors.position_id} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pay_frequency">Pay Frequency <span className="text-red-500">*</span></Label>
                                    <select 
                                        id="pay_frequency" 
                                        value={data.pay_frequency} 
                                        onChange={e => setData('pay_frequency', e.target.value)} 
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    >
                                        <option value="">Select a Pay Frequency</option>
                                        <option value="weekender">Weekender</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="semi_monthly">Semi-Monthly</option>
                                    </select>
                                    <InputError message={errors.pay_frequency} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="employee_status">Status <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="employee_status" 
                                        type="text" 
                                        value={data.employee_status} 
                                        className="w-full h-10 px-3 rounded-md border border-input bg-gray-100" 
                                        readOnly 
                                        placeholder="Employee Status" 
                                    />
                                    <InputError message={errors.employee_status} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergency_contact_number">Emergency Contact</Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+63</span>
                                        <Input 
                                            id="emergency_contact_number" 
                                            type="text" 
                                            value={getDisplayValue('emergency_contact_number')} 
                                            onChange={e => handlePhoneChange('emergency_contact_number', e.target.value)} 
                                            className="w-full rounded-l-none" 
                                            placeholder="XXX XXX XXXX" 
                                            maxLength={10} 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2">Location Assignment</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="branch_id">Branch <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <div 
                                        className="flex items-center border border-input rounded-md cursor-pointer" 
                                        onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                                    >
                                        <div className="flex-1 px-3 py-2 text-sm">
                                            {selectedBranch?.branch_name || 'Select a Branch'}
                                        </div>
                                        <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                                    </div>
                                    {showBranchDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-input rounded-md shadow-lg">
                                            <div className="p-2 border-b">
                                                <div className="relative">
                                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input 
                                                        value={branchSearch} 
                                                        onChange={(e) => setBranchSearch(e.target.value)} 
                                                        placeholder="Search branches..." 
                                                        className="pl-8" 
                                                        autoFocus 
                                                        onClick={(e) => e.stopPropagation()} 
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-60 overflow-auto">
                                                {filteredBranches.length > 0 ? (
                                                    filteredBranches.map((branch) => (
                                                        <div 
                                                            key={branch.id} 
                                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm" 
                                                            onClick={() => selectBranch(branch.id.toString(), branch.branch_name)}
                                                        >
                                                            {branch.branch_name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-sm text-gray-500">No branches found</div>
                                                )}
                                                {filteredBranches.length === 5 && branches.length > 5 && (
                                                    <div className="px-3 py-2 text-xs text-gray-400 border-t">Showing top 5 results</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <InputError message={errors.branch_id} />
                            </div>
                            {data.branch_id && (
                                <div className="space-y-2">
                                    <Label htmlFor="site_id">Site <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div 
                                            className="flex items-center border border-input rounded-md cursor-pointer" 
                                            onClick={() => setShowSiteDropdown(!showSiteDropdown)}
                                        >
                                            <div className="flex-1 px-3 py-2 text-sm">
                                                {selectedSite?.site_name || selectedSite?.name || 'Select a Site'}
                                            </div>
                                            <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                                        </div>
                                        {showSiteDropdown && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-input rounded-md shadow-lg">
                                                <div className="p-2 border-b">
                                                    <div className="relative">
                                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input 
                                                            value={siteSearch} 
                                                            onChange={(e) => setSiteSearch(e.target.value)} 
                                                            placeholder="Search sites..." 
                                                            className="pl-8" 
                                                            autoFocus 
                                                            onClick={(e) => e.stopPropagation()} 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-60 overflow-auto">
                                                    {filteredSites.length > 0 ? (
                                                        filteredSites.map((site) => {
                                                            const siteName = site.site_name || site.name || '';
                                                            return (
                                                                <div 
                                                                    key={site.id} 
                                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm" 
                                                                    onClick={() => selectSite(site.id.toString(), siteName)}
                                                                >
                                                                    {siteName}
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="px-3 py-2 text-sm text-gray-500">No sites found</div>
                                                    )}
                                                    {filteredSites.length === 5 && availableSites.length > 5 && (
                                                        <div className="px-3 py-2 text-xs text-gray-400 border-t">Showing top 5 results</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <InputError message={errors.site_id} />
                                    {availableSites.length === 0 && (
                                        <p className="text-sm text-amber-600 mt-1">No sites available for this branch</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2">Contract Period</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contract_start_date">Start Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="contract_start_date" 
                                    type="date" 
                                    value={data.contract_start_date} 
                                    onChange={e => setData('contract_start_date', e.target.value)} 
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background" 
                                />
                                <InputError message={errors.contract_start_date} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contract_end_date">End Date <span className="text-red-500">*</span></Label>
                                <Input 
                                    id="contract_end_date" 
                                    type="date" 
                                    value={data.contract_end_date} 
                                    onChange={e => setData('contract_end_date', e.target.value)} 
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background" 
                                    min={data.contract_start_date} 
                                />
                                <InputError message={errors.contract_end_date} />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Updating...' : 'Update Employee'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
            {(showPositionDropdown || showSiteDropdown || showBranchDropdown) && (
                <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => { 
                        setShowPositionDropdown(false); 
                        setShowSiteDropdown(false);
                        setShowBranchDropdown(false);
                    }} 
                />
            )}
        </HrLayout>
    );
}
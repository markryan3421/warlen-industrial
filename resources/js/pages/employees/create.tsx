import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Search, ChevronDown, User, Briefcase, MapPin, Calendar, Phone, Mail, Hash, Clock, LoaderCircle, PersonStanding, Shield } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
// import { toast } from 'sonner';
import { store } from '@/actions/App/Http/Controllers/EmployeeController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Employees', href: '/employees' },
    { title: 'Create', href: '/employees/create' },
];

interface Site {
    id: number;
    site_name: string;
    branch_id: number;
}

interface Branch {
    id: number;
    branch_name: string;
    branch_address?: string;
}

interface Props {
    positions: any[];
    branches: Branch[];
    site: Site[];
}

// ── Helper: calculate status from dates ──────────────────────────────────────
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

// ── Section card component ────────────────────────────────────────────────────
function FormSection({ icon: Icon, title, children, index = 0 }: {
    icon: React.ElementType; title: string; children: React.ReactNode; index?: number;
}) {
    return (
        <div
            className="form-section space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
            </div>
            {children}
        </div>
    );
}

// ── Custom dropdown with search ──────────────────────────────────────────────
interface DropdownItem {
    id: number | string;
    name: string;
}

interface DropdownProps {
    label: string;
    items: DropdownItem[];
    selectedId: string;
    onSelect: (id: string, name: string) => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    required?: boolean;
    searchPlaceholder?: string;
    showAllResults?: boolean;
}

function SearchableDropdown({
    label,
    items,
    selectedId,
    onSelect,
    searchValue,
    onSearchChange,
    placeholder = 'Select an option',
    disabled = false,
    error,
    required = false,
    searchPlaceholder = 'Search...',
    showAllResults = false,
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedItem = items.find(i => i.id.toString() === selectedId);

    return (
        <div className="space-y-2">
            <Label className="text-sm font-semibold">
                {label} {required && <span className="text-accent">*</span>}
            </Label>
            <div className="relative">
                <div
                    className={`flex cursor-pointer items-center justify-between rounded-xl border-2 bg-background px-4 py-2.5 transition-all ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                >
                    <span className={`text-sm ${!selectedItem ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {selectedItem?.name || placeholder}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>

                {isOpen && !disabled && (
                    <>
                        <div className="absolute z-10 mt-2 w-full rounded-xl border border-border bg-card shadow-lg">
                            <div className="p-2 border-b border-border">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={searchValue}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        placeholder={searchPlaceholder}
                                        className="pl-9"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                            <div className="max-h-60 overflow-auto p-1">
                                {items.length > 0 ? (
                                    items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors"
                                            onClick={() => {
                                                onSelect(item.id.toString(), item.name);
                                                setIsOpen(false);
                                            }}
                                        >
                                            {item.name}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
                                )}
                                {!showAllResults && items.length === 5 && (
                                    <div className="px-3 py-2 text-xs text-muted-foreground border-t mt-1 pt-2">
                                        Showing top 5 results. Use search to find more.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div
                            className="fixed inset-0 z-0"
                            onClick={() => setIsOpen(false)}
                        />
                    </>
                )}
            </div>
            {error && <InputError message={error} />}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Create({ positions, branches, site = [] }: Props) {
    const { auth } = usePage<any>().props;
    const [availableSites, setAvailableSites] = useState<Site[]>([]);
    const [positionSearch, setPositionSearch] = useState('');
    const [branchSearch, setBranchSearch] = useState('');
    const [siteSearch, setSiteSearch] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        position_id: '',
        branch_id: '',
        site_id: '',
        avatar: '',
        employee_number: '',
        emp_code: '',
        contract_start_date: '',
        contract_end_date: '',
        pay_frequency: '',
        emergency_contact_number: '',
        employee_status: '',
        // New government number fields
        sss_number: '',
        pagibig_number: '',
        philhealth_number: '',
    });

    // Update available sites when branch changes
    useEffect(() => {
        if (data.branch_id) {
            const filtered = site.filter(s => s.branch_id === parseInt(data.branch_id));
            setAvailableSites(filtered);

            // 🔁 Clear site_id if the current value is not valid for the new branch
            const currentSiteId = data.site_id;
            if (currentSiteId) {
                const stillValid = filtered.some(s => s.id === parseInt(currentSiteId));
                if (!stillValid) {
                    setData('site_id', '');
                    setSiteSearch('');
                }
            } else {
                // If branch changes and no site was selected, ensure site_id is cleared
                setData('site_id', '');
                setSiteSearch('');
            }
        } else {
            setAvailableSites([]);
            setData('site_id', '');
            setSiteSearch('');
        }
    }, [data.branch_id]);

    // Auto‑calculate employee status from contract dates
    useEffect(() => {
        if (data.contract_start_date && data.contract_end_date) {
            setData('employee_status', getStatusFromDates(data.contract_start_date, data.contract_end_date));
        } else {
            setData('employee_status', 'Inactive');
        }
    }, [data.contract_start_date, data.contract_end_date]);

    // Format phone number display
    const handlePhoneChange = (field: 'employee_number' | 'emergency_contact_number', value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 10);
        setData(field, digits ? `+63${digits}` : '');
    };
    const getDisplayValue = (field: 'employee_number' | 'emergency_contact_number') => {
        return data[field] ? data[field].replace('+63', '') : '';
    };

    // Helper for government numbers (numeric-only input)
    const handleGovNumberChange = (
        field: 'sss_number' | 'pagibig_number' | 'philhealth_number',
        value: string,
        maxLength: number
    ) => {
        // Allow only digits and hyphens
        const cleaned = value.replace(/[^0-9\-]/g, '').slice(0, maxLength);
        setData(field, cleaned);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store().url, {
            // onSuccess: (page) => {
            //     toast.success((page.props as any).flash?.success || 'Employee created successfully.');
            // },
            // onError: (errors) => {
            //     toast.error(Object.values(errors).flat()[0] || 'Failed to create employee.');
            // },
        });
    };

    // Prepare dropdown items
    const positionItems = positions.map(p => ({ id: p.id, name: p.pos_name }));
    const branchItems = branches.map(b => ({ id: b.id, name: b.branch_name }));
    const siteItems = availableSites.map(s => ({ id: s.id, name: s.site_name || s.site_name || '' }));

    const filteredPositions = positionItems.filter(p =>
        p.name.toLowerCase().includes(positionSearch.toLowerCase())
    ).slice(0, 5);
    const filteredBranches = branchItems.filter(b =>
        b.name.toLowerCase().includes(branchSearch.toLowerCase())
    ).slice(0, 5);
    const filteredSites = siteItems.filter(s =>
        s.name.toLowerCase().includes(siteSearch.toLowerCase())
    ).slice(0, 5);

    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        auth.user.avatar ? `/storage/${auth.user.avatar}` : null
    );
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee" />

            <style>{`
                @keyframes formFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .form-section { animation: formFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

            <div className="min-h-screen py-8 md:py-10">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* Page header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md">
                                <User className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    HR Management
                                </p>
                                <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                                    Create New Employee
                                </h1>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => router.get('/employees')}
                            className="rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                            Cancel
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                        {/* 1. Avatar */}
                        <FormSection icon={PersonStanding} title="Avatar" index={1}>
                            {/* Avatar Upload Section */}
                            <div className="grid gap-2">
                                <Label>Profile picture</Label>

                                <div className="flex items-center gap-4">
                                    {/* Avatar Preview */}
                                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                                        {avatarPreview ? (
                                            <img
                                                src={avatarPreview}
                                                alt="Profile preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                                                <svg
                                                    className="h-10 w-10"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Buttons */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={processing}
                                            >
                                                Choose image
                                            </Button>

                                            {avatarPreview && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        handleRemoveAvatar();
                                                        setData('avatar', null as any);
                                                    }}
                                                    disabled={processing}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                            Recommended: Square image, at least 200x200px. Max size: 2MB
                                        </p>
                                    </div>

                                    <Input
                                        ref={fileInputRef}
                                        id="avatar"
                                        type="file"
                                        name="avatar"
                                        accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                        onChange={(e) => {
                                            handleAvatarChange(e);
                                            const file = e.target.files?.[0];
                                            setData('avatar', file as any);
                                        }}
                                        className="hidden"
                                    />
                                </div>

                                {errors.avatar && (
                                    <InputError
                                        className="mt-2"
                                        message={errors.avatar}
                                    />
                                )}
                            </div>
                        </FormSection>

                        {/* 2. User Details */}
                        <FormSection icon={User} title="User Details" index={2}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">
                                        Employee Code <span className="text-accent">*</span>
                                    </Label>
                                    <Input
                                        value={data.emp_code}
                                        onChange={e => setData('emp_code', e.target.value)}
                                        placeholder="e.g., EMP001"
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.emp_code} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">
                                        Full Name <span className="text-accent">*</span>
                                    </Label>
                                    <Input
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="John Doe"
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">
                                        Email <span className="text-accent">*</span>
                                    </Label>
                                    <Input
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        placeholder="john@example.com"
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">
                                        Password <span className="text-accent">*</span>
                                    </Label>
                                    <Input
                                        type="password"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.password} />
                                </div>
                            </div>
                        </FormSection>

                        {/* 3. Employee Details */}
                        <FormSection icon={Briefcase} title="Employee Details" index={3}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">
                                        Contact Number <span className="text-accent">*</span>
                                    </Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center rounded-l-xl border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                            +63
                                        </span>
                                        <Input
                                            type="text"
                                            value={getDisplayValue('employee_number')}
                                            onChange={e => handlePhoneChange('employee_number', e.target.value)}
                                            placeholder="XXX XXX XXXX"
                                            maxLength={10}
                                            className="rounded-l-none rounded-r-xl"
                                        />
                                    </div>
                                    <InputError message={errors.employee_number} />
                                </div>

                                <SearchableDropdown
                                    label="Position"
                                    items={filteredPositions}
                                    selectedId={data.position_id}
                                    onSelect={(id, name) => {
                                        setData('position_id', id);
                                        setPositionSearch(name);
                                    }}
                                    searchValue={positionSearch}
                                    onSearchChange={setPositionSearch}
                                    required
                                    error={errors.position_id}
                                    placeholder="Select a position"
                                    searchPlaceholder="Search positions..."
                                    showAllResults={false}
                                />

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">
                                        Pay Frequency <span className="text-accent">*</span>
                                    </Label>
                                    <select
                                        value={data.pay_frequency}
                                        onChange={e => setData('pay_frequency', e.target.value)}
                                        className="w-full rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                    >
                                        <option value="">Select a Pay Frequency</option>
                                        <option value="weekender">Weekender</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="semi_monthly">Semi-Monthly</option>
                                    </select>
                                    <InputError message={errors.pay_frequency} />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">
                                        Status
                                    </Label>
                                    <div className="flex h-11 items-center rounded-xl border-2 border-border bg-muted/30 px-4 text-sm text-foreground">
                                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {data.employee_status || 'Inactive'}
                                    </div>
                                    <InputError message={errors.employee_status} />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-sm font-semibold">Emergency Contact</Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center rounded-l-xl border border-r-0 border-border bg-muted px-3 text-sm text-muted-foreground">
                                            +63
                                        </span>
                                        <Input
                                            type="text"
                                            value={getDisplayValue('emergency_contact_number')}
                                            onChange={e => handlePhoneChange('emergency_contact_number', e.target.value)}
                                            placeholder="XXX XXX XXXX"
                                            maxLength={10}
                                            className="rounded-l-none rounded-r-xl"
                                        />
                                    </div>
                                </div>
                            </div>
                        </FormSection>

                        {/* 🆕 4. Government Numbers (SSS, Pag-IBIG, PhilHealth) */}
                        <FormSection icon={Shield} title="Government Numbers" index={4}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">
                                        SSS Number <span className="text-accent">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        value={data.sss_number}
                                        onChange={e => handleGovNumberChange('sss_number', e.target.value, 15)}
                                        placeholder="e.g., 12-3456789-1"
                                        maxLength={15}
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.sss_number} />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">
                                        Pag-IBIG Membership ID <span className="text-accent">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        value={data.pagibig_number}
                                        onChange={e => handleGovNumberChange('pagibig_number', e.target.value, 15)}
                                        placeholder="e.g., 9102-1234-5678"
                                        maxLength={15}
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.pagibig_number} />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">
                                        PhilHealth Identification Number (PIN) <span className="text-accent">*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        value={data.philhealth_number}
                                        onChange={e => handleGovNumberChange('philhealth_number', e.target.value, 15)}
                                        placeholder="e.g., 9102-1234-5678"
                                        maxLength={15}
                                        className="rounded-xl"
                                    />
                                    <InputError message={errors.philhealth_number} />
                                </div>
                            </div>
                        </FormSection>

                        {/* 5. Contract Period */}
                        <FormSection icon={Calendar} title="Contract Period" index={5}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">
                                        Start Date <span className="text-accent">*</span>
                                    </Label>
                                    <DatePicker
                                        value={data.contract_start_date}
                                        onChange={(date) => setData('contract_start_date', date)}
                                        placeholder='Select contract start date'
                                    />
                                    <InputError message={errors.contract_start_date} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">
                                        End Date <span className="text-accent">*</span>
                                    </Label>
                                    <DatePicker
                                        value={data.contract_end_date}
                                        onChange={(date) => setData('contract_end_date', date)}
                                        placeholder='Select contract end date'
                                        minDate={data.contract_start_date ? new Date(data.contract_start_date) : undefined}
                                    />
                                    <InputError message={errors.contract_end_date} />
                                </div>
                            </div>
                        </FormSection>

                        {/* 6. Location Assignment */}
                        <FormSection icon={MapPin} title="Location Assignment" index={6}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <SearchableDropdown
                                    label="Branch"
                                    items={filteredBranches}
                                    selectedId={data.branch_id}
                                    onSelect={(id, name) => {
                                        setData('branch_id', id);
                                        setBranchSearch(name);
                                    }}
                                    searchValue={branchSearch}
                                    onSearchChange={setBranchSearch}
                                    required
                                    error={errors.branch_id}
                                    placeholder="Select a branch"
                                    searchPlaceholder="Search branches..."
                                    showAllResults={false}
                                />

                                {data.branch_id && (
                                    <SearchableDropdown
                                        label="Site"
                                        items={filteredSites}
                                        selectedId={data.site_id}
                                        onSelect={(id, name) => {
                                            setData('site_id', id);
                                            setSiteSearch(name);
                                        }}
                                        searchValue={siteSearch}
                                        onSearchChange={setSiteSearch}
                                        required
                                        error={errors.site_id}
                                        placeholder="Select a site"
                                        searchPlaceholder="Search sites..."
                                        showAllResults={false}
                                        disabled={availableSites.length === 0}
                                    />
                                )}
                            </div>
                        </FormSection>

                        {/* Submit button */}
                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="min-w-[140px] rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
                            >
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                {processing ? 'Creating...' : 'Create Employee'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
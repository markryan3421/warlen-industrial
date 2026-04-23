// pages/incentives/create.tsx
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Coins, Save, Users, Plus, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IncentiveEmployeeSelector } from '@/components/incentive-employee-selector';
import { toast } from '@/components/custom-toast';
import type { BreadcrumbItem } from '@/types';
import IncentiveController, { store } from '@/actions/App/Http/Controllers/IncentiveController';

/* ─────────────────────────────────────────────────────────────
Keyframes — shared with edit.tsx
───────────────────────────────────────────────────────────── */
const KF = `@keyframes incFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} } @keyframes incScaleIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }`;
if (typeof document !== 'undefined' && !document.getElementById('inc-kf')) {
  const s = document.createElement('style'); s.id = 'inc-kf'; s.textContent = KF;
  document.head.appendChild(s);
}
const fu = (d = 0): React.CSSProperties => ({ animation: `incFadeUp 0.4s ease both`, animationDelay: `${d}ms` });

/* ─────────────────────────────────────────────────────────────
Types
───────────────────────────────────────────────────────────── */
interface Employee {
  id: number;
  emp_code?: string | number | null;
  user?: { name: string } | null;
  name?: string;
}
interface PayrollPeriod {
  id: number;
  start_date: string;
  end_date: string;
  pay_date: string;
  payroll_per_status: string;
}
interface Props {
  payroll_periods: PayrollPeriod[];
  employees: Employee[];
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

/* ─────────────────────────────────────────────────────────────
Shared sub-components
───────────────────────────────────────────────────────────── */
function NavyCardHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="bg-[#1d4791] px-5 py-4 flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-xs font-bold tracking-widest uppercase text-white">{title}</p>
        {subtitle && <p className="text-[10px] text-white/65 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldGroup({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-700">
        {label} {required && <span className="text-[#d85e39]">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[10px] text-slate-400">{hint}</p>}
      {error && <p className="text-[10px] text-[#d85e39]">⚠ {error}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
Main page
───────────────────────────────────────────────────────────── */
export default function Create({ payroll_periods, employees }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Incentives', href: '/incentives' },
    { title: 'Create', href: '/incentives/create' },
  ];

  const { data, setData, post, processing, errors, reset } = useForm({
    incentive_name:    '',
    incentive_amount:  '', 
    payroll_period_id: '',
    employee_ids:      [] as number[],
    is_daily:          false,
  });

  // Filter payroll periods to only show OPEN ones (not processing or calculated)
  const availablePayrollPeriods = payroll_periods.filter(period => 
    period.payroll_per_status === 'OPEN' || period.payroll_per_status === 'open'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(IncentiveController.store().url, {
      // onSuccess: () => {
      //   toast.success('Incentive created successfully');
      //   reset();
      // },
      // onError: (errs) => toast.error(Object.values(errs).flat()[0] as string || 'Failed to create incentive'),
    });
  };

  const toggleEmployee = (id: number) =>
    setData('employee_ids',
      data.employee_ids.includes(id)
        ? data.employee_ids.filter(x => x !== id)
        : [...data.employee_ids, id]
    );

  const handleSelectAll = (ids: number[]) => setData('employee_ids', ids);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Incentive" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto space-y-5">

        {/* ── Page header ── */}
        <div style={fu(0)} className="flex items-center justify-between">
          <a href="/incentives"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#1d4791] transition-colors group">
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Incentives
          </a>

          <div className="bg-[#1d4791] px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-md">
            <div className="h-7 w-7 rounded-lg bg-white/15 flex items-center justify-center">
              <Plus className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-white">New Incentive</p>
              <p className="text-[10px] text-white/55 mt-0.5 max-w-[200px] truncate">Define bonus structure & recipients</p>
            </div>
          </div>
        </div>

        {/* ── Form Grid ── */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* Column 1: Incentive Details */}
          <div style={fu(60)} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white h-fit">
            <NavyCardHeader
              icon={<Coins className="h-4 w-4 text-white" />}
              title="Incentive Details"
              subtitle="Name, amount, and frequency"
            />
            <div className="p-5 space-y-5">
              <FieldGroup label="Incentive Name" required error={errors.incentive_name}>
                <Input
                  value={data.incentive_name}
                  onChange={e => setData('incentive_name', e.target.value)}
                  placeholder="Enter incentive name"
                  className="h-9 text-sm border-slate-200 focus:border-[#1d4791] focus:ring-2 focus:ring-[#1d4791]/20"
                />
              </FieldGroup>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldGroup label="Amount (₱)" required error={errors.incentive_amount}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium select-none">₱</span>
                    <Input
                      type="number" step="0.01" min="0"
                      value={data.incentive_amount}
                      onChange={e => setData('incentive_amount', e.target.value)}
                      placeholder="0.00"
                      className="pl-7 h-9 text-sm border-slate-200 focus:border-[#1d4791] focus:ring-2 focus:ring-[#1d4791]/20"
                    />
                  </div>
                </FieldGroup>

                {/* Only show Payroll Period field if there are available OPEN periods */}
                {availablePayrollPeriods.length > 0 && (
                  <FieldGroup label="Payroll Period" required error={errors.payroll_period_id}>
                    <Select value={data.payroll_period_id} onValueChange={v => setData('payroll_period_id', v)}>
                      <SelectTrigger className="h-9 text-sm border-slate-200 focus:ring-2 focus:ring-[#1d4791]/20 focus:border-[#1d4791]">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl">
                        {availablePayrollPeriods.map(p => (
                          <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {fmtDate(p.start_date)} – {fmtDate(p.end_date)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldGroup>
                )}

                {/* Show message when no OPEN periods available */}
                {availablePayrollPeriods.length === 0 && (
                  <div className="col-span-1 sm:col-span-2">
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                      <p className="text-xs text-amber-700">
                        ⚠️ No open payroll periods available. Please create or open a payroll period first before creating incentives.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Daily toggle */}
              <button
                type="button"
                onClick={() => setData('is_daily', !data.is_daily)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                  data.is_daily
                    ? 'bg-[#1d4791]/5 border-[#1d4791]/25'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-700">Daily Incentive</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Applies per day instead of one-time</p>
                </div>
                {data.is_daily
                  ? <ToggleRight className="h-6 w-6 text-[#1d4791] flex-shrink-0" />
                  : <ToggleLeft className="h-6 w-6 text-slate-300 flex-shrink-0" />
                }
              </button>

              {/* Current amount preview */}
              {data.incentive_amount && !isNaN(Number(data.incentive_amount)) && Number(data.incentive_amount) > 0 && (
                <div className="rounded-xl bg-[#1d4791]/4 border border-[#1d4791]/15 px-4 py-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {data.is_daily ? 'Daily rate' : 'One-time amount'}
                  </span>
                  <span className="text-sm font-bold text-[#1d4791]">
                    ₱{Number(data.incentive_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Employee Assignment */}
          <div style={fu(120)} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white h-fit">
            <NavyCardHeader
              icon={<Users className="h-4 w-4 text-white" />}
              title="Employee Assignment"
              subtitle="Manage who receives this incentive"
            />
            <div className="p-5">
              <IncentiveEmployeeSelector
                employees={employees}
                selectedIds={data.employee_ids}
                onToggle={toggleEmployee}
                onSelectAll={handleSelectAll}
                onRemoveAll={() => setData('employee_ids', [])}
                error={errors.employee_ids as string | undefined}
              />
            </div>
          </div>

          {/* Action row - Spans both columns */}
          <div style={fu(180)} className="col-span-1 lg:col-span-2 flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.get('/incentives')}
              className="h-9 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={processing || availablePayrollPeriods.length === 0}
              className="h-9 px-5 rounded-lg bg-[#1d4791] hover:bg-[#1d4791]/90 text-white text-xs font-bold shadow-sm shadow-[#1d4791]/20 flex items-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {processing
                ? <> <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creating… </>
                : <> <Save className="h-3.5 w-3.5" />Create Incentive </>
              }
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
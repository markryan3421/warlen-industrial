// pages/incentives/edit.tsx
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Coins, Save, Pencil, Users, Calendar, AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/hr-layout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IncentiveEmployeeSelector } from '@/components/incentive-employee-selector';
import { toast } from '@/components/custom-toast';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem } from '@/types';
import IncentiveController from '@/actions/App/Http/Controllers/HrRole/HRIncentiveController';

/* ─────────────────────────────────────────────────────────────
Keyframes
───────────────────────────────────────────────────────────── */
const KF = `@keyframes incFadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }`;
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
interface Incentive {
  id: number;
  incentive_name: string;
  incentive_amount: string | number;
  payroll_period_id: number;
  is_daily: boolean;
  employees?: Employee[];
}
interface Props {
  incentive: Incentive;
  payroll_periods: PayrollPeriod[];
  employees: Employee[];
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

const getStatusBadge = (status: string) => {
  const statusLower = status?.toLowerCase();
  switch (statusLower) {
    case 'open':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">OPEN</Badge>;
    case 'processing':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px]">PROCESSING</Badge>;
    case 'calculated':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">CALCULATED</Badge>;
    default:
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-[10px]">{status}</Badge>;
  }
};

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
export default function Edit({ incentive, payroll_periods, employees }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Incentives', href: '/hr/incentives' },
    { title: incentive.incentive_name, href: '#' },
  ];

  const { data, setData, put, processing, errors } = useForm({
    incentive_name:    incentive.incentive_name || '',
    incentive_amount:  String(incentive.incentive_amount || ''), 
    payroll_period_id: String(incentive.payroll_period_id || ''),
    employee_ids:      incentive.employees?.map(e => e.id) ?? [],
    is_daily:          incentive.is_daily ?? false,
  });

  // Find the currently selected period to show its status
  const selectedPeriod = payroll_periods.find(p => p.id === Number(data.payroll_period_id));
  const isSelectedPeriodOpen = selectedPeriod?.payroll_per_status?.toLowerCase() === 'open';
  const canEdit = isSelectedPeriodOpen;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('Cannot edit incentive for a closed or processed payroll period');
      return;
    }
    put(IncentiveController.update(incentive.id).url, {
      // onSuccess: () => toast.success('Incentive updated successfully'),
      // onError:   (errs) => toast.error(Object.values(errs).flat()[0] as string || 'Failed to update incentive'),
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
      <Head title={`Edit: ${incentive.incentive_name}`} />

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto space-y-5">

        {/* ── Page header ── */}
        <div style={fu(0)} className="flex items-center justify-between">
          <a href="/hr/incentives"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#1d4791] transition-colors group">
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Incentives
          </a>

          <div className="bg-[#1d4791] px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-md">
            <div className="h-7 w-7 rounded-lg bg-white/15 flex items-center justify-center">
              <Pencil className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-white">Edit Incentive</p>
              <p className="text-[10px] text-white/55 mt-0.5 max-w-[200px] truncate">{incentive.incentive_name}</p>
            </div>
          </div>
        </div>

        {/* Warning for non-OPEN payroll period */}
        {!canEdit && (
          <div style={fu(30)} className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              This incentive is associated with a {selectedPeriod?.payroll_per_status?.toLowerCase() || 'closed'} payroll period and cannot be edited.
              Please create a new incentive for an open payroll period if changes are needed.
            </p>
          </div>
        )}

        {/* ── Form Grid ── */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* Column 1: Incentive Details */}
          <div style={fu(60)} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white h-fit">
            <NavyCardHeader
              icon={<Coins className="h-4 w-4 text-white" />}
              title="Incentive Details"
              subtitle="Edit name, amount, frequency, and payroll period"
            />
            <div className="p-5 space-y-5">
              <FieldGroup label="Incentive Name" required error={errors.incentive_name}>
                <Input
                  value={data.incentive_name}
                  onChange={e => setData('incentive_name', e.target.value)}
                  placeholder="Enter incentive name"
                  disabled={!canEdit}
                  className={`h-9 text-sm border-slate-200 focus:border-[#1d4791] focus:ring-2 focus:ring-[#1d4791]/20 ${!canEdit ? 'bg-slate-50' : ''}`}
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
                      disabled={!canEdit}
                      className={`pl-7 h-9 text-sm border-slate-200 focus:border-[#1d4791] focus:ring-2 focus:ring-[#1d4791]/20 ${!canEdit ? 'bg-slate-50' : ''}`}
                    />
                  </div>
                </FieldGroup>

                <FieldGroup label="Payroll Period" required error={errors.payroll_period_id}>
                  <Select 
                    value={data.payroll_period_id} 
                    onValueChange={v => setData('payroll_period_id', v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger className={`h-9 text-sm border-slate-200 focus:ring-2 focus:ring-[#1d4791]/20 focus:border-[#1d4791] ${!canEdit ? 'bg-slate-50' : ''}`}>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      {payroll_periods.map(p => (
                        <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {fmtDate(p.start_date)} – {fmtDate(p.end_date)}
                            </span>
                            {/* {getStatusBadge(p.payroll_per_status)} */}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPeriod && !isSelectedPeriodOpen && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      ⚠️ This payroll period is {selectedPeriod.payroll_per_status?.toLowerCase()}. Changes are not allowed.
                    </p>
                  )}
                </FieldGroup>
              </div>

              {/* Daily toggle - incentive specific */}
              <button
                type="button"
                onClick={() => canEdit && setData('is_daily', !data.is_daily)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                  !canEdit ? 'opacity-60 cursor-not-allowed bg-slate-50' : 
                  data.is_daily
                    ? 'bg-[#1d4791]/5 border-[#1d4791]/25'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
                disabled={!canEdit}
              >
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-700">Daily Incentive</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Applies per day instead of one-time</p>
                </div>
                {data.is_daily
                  ? <div className="h-6 w-6 rounded-full bg-[#1d4791]/10 flex items-center justify-center">✓</div>
                  : <div className="h-6 w-6 rounded-full border border-slate-300 flex items-center justify-center"> </div>
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
                onToggle={canEdit ? toggleEmployee : () => {}}
                onSelectAll={canEdit ? handleSelectAll : () => {}}
                onRemoveAll={canEdit ? () => setData('employee_ids', []) : () => {}}
                error={errors.employee_ids as string | undefined}
                disabled={!canEdit}
              />
              {!canEdit && (
                <p className="text-[10px] text-amber-600 mt-2 text-center">
                  Employee assignment cannot be changed for this payroll period.
                </p>
              )}
            </div>
          </div>

          {/* Action row - Spans both columns */}
          <div style={fu(180)} className="col-span-1 lg:col-span-2 flex items-center justify-end gap-3 pt-2">
            <Link as='button' href="/hr/incentives"
              className="h-9 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={processing || !canEdit}
              className={`h-9 px-5 rounded-lg bg-[#1d4791] hover:bg-[#1d4791]/90 text-white text-xs font-bold shadow-sm shadow-[#1d4791]/20 flex items-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}>
              {processing
                ? <> <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving… </>
                : <> <Save className="h-3.5 w-3.5" />Update Incentive </>
              }
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
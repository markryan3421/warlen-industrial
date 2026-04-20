<?php

namespace App\Services;

use App\Enums\ApplicationLeaveEnum;
use App\Enums\PayrollPeriodStatusEnum;
use App\Models\ApplicationLeave;
use App\Models\AttendancePeriodStat;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\PayrollPeriod;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }
    public function getTotalNetPay(): float
    {
        // $sumNetPay = Payroll::query()->sum('net_pay');

        $payrollPeriods = PayrollPeriod::query()
            ->where('payroll_per_status', PayrollPeriodStatusEnum::COMPLETED->value)
            ->pluck('id');

        // Sum net pay from payrolls that belong to completed payroll periods
        $sumNetPay = Payroll::query()
            ->whereIn('payroll_period_id', $payrollPeriods)
            ->sum('net_pay');

        return (float) number_format($sumNetPay, 2, '.', '');
    }

    public function getActiveEmployee(): int
    {
        return Employee::query()->where('employee_status', 'active')->count();
    }

    public function getOpenPayrollPeriod(): int
    {
        $now = Carbon::now();
        $startOfMonth = $now->startOfMonth()->format('Y-m-d');
        $endOfMonth = $now->endOfMonth()->format('Y-m-d');

        //return $this->countOpenPayrollPeriod($startOfMonth, $endOfMonth);

        return PayrollPeriod::query()->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)->count();
    }


    public function getPayrollActivityMessage(): string
    {
        $openPeriods = $this->getOpenPayrollPeriod();
        if ($openPeriods > 0) {
            return "Open payroll period exists";
        }

        $lastPayroll = Payroll::latest('created_at')->first();
        if (!$lastPayroll) {
            return "No payroll has been run yet";
        }

        $daysSince = $lastPayroll->created_at->diffInDays(now());
        if ($daysSince > 30) {
            return "Payroll not run for {$daysSince} days";
        }

        return "Payroll is up to date";
    }

    protected function countOpenPayrollPeriod($startOfMonth, $endOfMonth): int
    {
        return PayrollPeriod::query()
            ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
            ->where(function ($query) use ($startOfMonth, $endOfMonth) {
                $query->whereBetween('start_date', [$startOfMonth, $endOfMonth])
                    ->orWhereBetween('end_date', [$startOfMonth, $endOfMonth])
                    ->orWhere(function ($q) use ($startOfMonth, $endOfMonth) {
                        $q->where('start_date', '<=', $startOfMonth)
                            ->where('end_date', '>=', $endOfMonth);
                    });
            })
            ->count();
    }

    public function getPendingApplicationLeave(): int
    {
        return ApplicationLeave::query()->where('app_status', ApplicationLeaveEnum::PENDING->value)->count();
    }

    public function getMonthlyPayrollTrend(): array
    {
        $driver = $this->getDriver();

        if ($driver == 'pgsql') {
            $monthlyData = $this->getPgsqlMonthlyData();
        }
        if ($driver == 'mysql') {
            $monthlyData = $this->getMysqlMonthlyData();
        }

        // Format the data for the chart (Jan, Feb, etc.)
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $formattedData = [];

        for ($i = 1; $i <= 12; $i++) {
            $formattedData[] = [
                'month' => $months[$i - 1],
                'desktop' => $monthlyData[$i] ?? 0, // 'desktop' matches your chart dataKey
                'mobile' => 0 // You can add mobile data if needed
            ];
        }

        return $formattedData;
    }

    public function getNewRegEmployeesCount(): int
    {
        return Employee::query()
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->count();
    }

    public function getScheduleDevCount(): int
    {
        $openPeriod = PayrollPeriod::where('payroll_per_status', 'open')->first();
        if ($openPeriod) {
            return AttendancePeriodStat::whereBetween('period_start', [$openPeriod->start_date, $openPeriod->end_date])
                ->sum('leave_early_times');
        }

        // Option 2: For today (if no open period)
        $today = Carbon::today();
        return AttendancePeriodStat::where('period_start', '<=', $today)
            ->where('period_end', '>=', $today)
            ->sum('leave_early_times');
    }

    public function getEmployeePayFrequency(): array
    {
        $labels = [
            'weekender' => 'Weekender',
            'monthly' => 'Monthly',
            'semi_monthly' => 'Semi-Monthly',
        ];

        $distribution = [];

        foreach ($labels as $key => $label) {
            $count = Employee::query()
                ->where('employee_status', 'active')
                ->where('pay_frequency', $key)
                ->count();

            if ($count > 0) {
                $distribution[] = [
                    'name' => $label,
                    'value' => $count,
                ];
            }
        }

        return $distribution;
    }

    protected function getPgsqlMonthlyData(): array
    {
        $monthlyData = Payroll::query()
            ->selectRaw('EXTRACT(MONTH FROM created_at) as month, SUM(net_pay) as total')
            ->whereYear('created_at', now()->year)
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month')
            ->toArray();

        return $monthlyData;
    }

    protected function getMysqlMonthlyData(): array
    {
        $monthlyData = Payroll::query()
            ->selectRaw('MONTH(created_at) as month, SUM(net_pay) as total')
            ->whereYear('created_at', now()->year)
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month')
            ->toArray();

        return $monthlyData;
    }

    private function getDriver(): string
    {
        return DB::connection()->getDriverName();
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\AttendancePeriodStat;
use App\Models\Payroll;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class EmployeeDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $employee = $user->employee;

        if (!$employee) {
            abort(403, 'No employee record found for this user.');
        }

        // 1. Attendance stats (from biometric system)
        $attendanceIdentifiers = collect([
            (string) $employee->emp_code,
            $employee->employee_number,
        ])->filter()->unique();

        $periodStats = AttendancePeriodStat::whereIn('employee_id', $attendanceIdentifiers)
            ->orderBy('period_start', 'desc')
            ->get();

        // 2. Payroll data (real monetary values)
        $payrolls = Payroll::where('employee_id', $employee->id)
            ->with('payrollPeriod') // assumes PayrollPeriod model exists with start_date
            ->get();

        // Map each payroll to its period start date (e.g., '2025-09-01')
        $payrollMap = [];
        foreach ($payrolls as $payroll) {
            if ($payroll->payrollPeriod) {
                $key = Carbon::parse($payroll->payrollPeriod->start_date)->format('Y-m-d');
                $payrollMap[$key] = $payroll->net_pay;
            }
        }

        // 3. Enrich attendance stats with net_pay from payrolls (fallback to real_pay if missing)
        $enrichedStats = $periodStats->map(function ($stat) use ($payrollMap) {
            $key = Carbon::parse($stat->period_start)->format('Y-m-d');
            $stat->net_pay = $payrollMap[$key] ?? $stat->real_pay; // use real_pay if payroll not found
            return $stat;
        });

        // 4. Lifetime totals (using net_pay)
        $lifetime = [
            'total_pay' => $enrichedStats->sum('net_pay'),
            'total_late_minutes' => $enrichedStats->sum('late_minutes'),
            'total_work_hours' => $enrichedStats->sum('real_work_hours'),
            'total_overtime_hours' => $enrichedStats->sum(function ($stat) {
                return $stat->overtime_workday + $stat->overtime_holiday + $stat->overtime_label;
            }),
        ];

        // 5. Build month list from contract dates (or fallback to earliest/latest period)
        $availableMonths = $this->buildAvailableMonths(
            $enrichedStats,
            $employee->contract_start_date,
            $employee->contract_end_date
        );

        // 6. Default month: most recent with data, or last month in range
        $defaultMonth = null;
        if ($enrichedStats->isNotEmpty()) {
            $latestStat = $enrichedStats->first();
            $defaultMonth = Carbon::parse($latestStat->period_start)->format('Y-m');
        } else {
            $lastMonth = end($availableMonths);
            if ($lastMonth) {
                $defaultMonth = $lastMonth['year'] . '-' . $lastMonth['month'];
            }
        }

        return Inertia::render('employee-role/dashboard', [
            'periodStats' => $enrichedStats,
            'lifetime' => $lifetime,
            'availableMonths' => $availableMonths,
            'defaultMonth' => $defaultMonth,
        ]);
    }

    private function buildAvailableMonths($periodStats, $contractStartDate, $contractEndDate = null)
    {
        // Fallback to earliest/latest period if contract dates are missing
        if (!$contractStartDate && $periodStats->isNotEmpty()) {
            $contractStartDate = $periodStats->min('period_start');
        }
        if (!$contractEndDate && $periodStats->isNotEmpty()) {
            $contractEndDate = $periodStats->max('period_end');
        }

        if (!$contractStartDate) {
            $contractStartDate = Carbon::now();
        }
        if (!$contractEndDate) {
            $contractEndDate = Carbon::now();
        }

        $start = Carbon::parse($contractStartDate)->startOfMonth();
        $end = Carbon::parse($contractEndDate)->startOfMonth();

        $months = [];
        while ($start <= $end) {
            $months[] = [
                'month' => $start->month,
                'year' => $start->year,
                'label' => $start->format('F Y'),
                'has_data' => false,
            ];
            $start->addMonth();
        }

        // Mark months that have actual data
        foreach ($periodStats as $stat) {
            $key = Carbon::parse($stat->period_start)->format('Y-m');
            foreach ($months as &$month) {
                if (Carbon::createFromDate($month['year'], $month['month'], 1)->format('Y-m') === $key) {
                    $month['has_data'] = true;
                    break;
                }
            }
        }

        return $months;
    }
}

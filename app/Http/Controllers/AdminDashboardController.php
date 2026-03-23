<?php

namespace App\Http\Controllers;

use App\Enums\ApplicationLeaveEnum;
use App\Enums\PayrollPeriodStatusEnum;
use App\Models\ApplicationLeave;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\PayrollPeriod;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function __invoke()
    {
        $totalNetPay = $this->getTotalNetPay();
        $totalActiveEmployee = $this->getActiveEmployee();
        $openPayrollPeriod = $this->getOpenPayrollPeriod();
        $pendingApplicationLeave = $this->getPendingApplicationLeave();

        return Inertia::render('dashboard', compact('totalNetPay', 'totalActiveEmployee', 'openPayrollPeriod', 'pendingApplicationLeave'));
    }

    protected function getTotalNetPay(): float
    {
        $sumNetPay = Payroll::query()->sum('net_pay');

        return (float) number_format($sumNetPay, 2, '.', '');
    }

    protected function getActiveEmployee(): int
    {
        return Employee::query()->where('employee_status', 'active')->count();
    }

    protected function getOpenPayrollPeriod(): int
    {
        $now = Carbon::now();
        $startOfMonth = $now->startOfMonth()->format('Y-m-d');
        $endOfMonth = $now->endOfMonth()->format('Y-m-d');

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

    protected function getPendingApplicationLeave():int
    {
        return ApplicationLeave::query()->where('app_status', ApplicationLeaveEnum::PENDING->value)->count();
    }
}

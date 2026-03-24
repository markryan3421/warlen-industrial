<?php

namespace App\Http\Controllers;

use App\Services\AdminDashboardService;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{

    public function __construct(private AdminDashboardService $service) {}
    public function __invoke()
    {
        $totalNetPay = $this->service->getTotalNetPay();
        $totalActiveEmployee = $this->service->getActiveEmployee();
        $openPayrollPeriod = $this->service->getOpenPayrollPeriod();
        $pendingApplicationLeave = $this->service->getPendingApplicationLeave();

        $payrollTrend = $this->service->getMonthlyPayrollTrend();
        $employee_pay_frequency = $this->service->getEmployeePayFrequency();

        return Inertia::render('dashboard', compact(
            'totalNetPay',
            'totalActiveEmployee',
            'openPayrollPeriod',
            'pendingApplicationLeave',
            'payrollTrend',
            'employee_pay_frequency'
        ));
    }
}

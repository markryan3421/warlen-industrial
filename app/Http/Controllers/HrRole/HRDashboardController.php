<?php

namespace App\Http\Controllers\HrRole;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HRDashboardController extends Controller
{
    public function __construct(private AdminDashboardService $service) {}
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $totalNetPay = $this->service->getTotalNetPay();
        $totalActiveEmployee = $this->service->getActiveEmployee();
        $openPayrollPeriod = $this->service->getOpenPayrollPeriod();
        $pendingApplicationLeave = $this->service->getPendingApplicationLeave();

        $payrollTrend = $this->service->getMonthlyPayrollTrend();
        $employee_pay_frequency = $this->service->getEmployeePayFrequency();

        return Inertia::render('HR/dashboard', compact(
            'totalNetPay',
            'totalActiveEmployee',
            'openPayrollPeriod',
            'pendingApplicationLeave',
            'payrollTrend',
            'employee_pay_frequency'
        ));
    }
}

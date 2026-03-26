<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use App\Services\PayrollService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Traits\HasPaginatedIndex;
use Inertia\Inertia;

class PayrollController extends Controller
{

    use HasPaginatedIndex;
    public function __construct(protected PayrollService $payrollService) {}
    /**
     * Display a listing of the resource.
     */ 
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Payroll::class);

        $payrolls = $this->payrollService->getPayroll();

        $result = $this->paginateCollection(
            items: collect($payrolls), // wrap in Collection if not already
            request: $request,
            searchColumns: [
                'employee.user.name',
                'employee.emp_code',
                'employee.position.pos_name',
                'payroll_period.period_name',
                'employee.pay_frequency'
                ],
        );

        return Inertia::render('payroll/index', [
            'payrolls' => $result['data'], // Only paginated data
            'pagination' => $result['pagination'], // Pagination metadata
            'filters' => $result['filters'],
            'totalCount' => $result['totalCount'],
            'filteredCount' => $result['filteredCount'],
            'totalOvertimePay' => $this->payrollService->calculateTotalOvertimePay($payrolls),
            'totalOvertimeHours' => $this->payrollService->calculateTotalOvertimeHours($payrolls),
            'totalDeductions' => $this->payrollService->calculateTotalDeductions($payrolls),
            'totalNetPay' => $this->payrollService->calculateTotalNetPay($payrolls),
            'totalGrossPay' => $this->payrollService->calculateTotalGrossPay($payrolls),
            'activeEmployee' => $this->payrollService->getActiveEmployeesInPayroll($payrolls)
            
            ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Payroll $payroll)
    {
        // $payroll->load([
        //     'payrollPeriod',
        //     'employee.user',
        //     'employee.position',
        //     'payrollItems'
        // ]);

        return Inertia::render('Payroll/Show', [
            'payroll' => $payroll
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Payroll $payroll)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payroll $payroll)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payroll $payroll)
    {
        //
    }
}

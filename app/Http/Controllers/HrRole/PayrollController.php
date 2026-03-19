<?php

namespace App\Http\Controllers\HrRole;

use App\Http\Controllers\Controller;
use App\Services\PayrollService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PayrollController extends Controller
{
    public function __construct(protected PayrollService $payrollService) {}
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
          $payrolls = $this->payrollService->getPayroll();

        return Inertia::render('HR/payroll/index', [
            'payrolls' => $payrolls,
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
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}

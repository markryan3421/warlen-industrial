<?php

namespace App\Http\Controllers;

use App\Actions\PayrollPeriod\CreateNewPayrollPeriod;
use App\Actions\PayrollPeriod\UpdatePayrollPeriod;
use App\Http\Requests\PayrollPeriod\StorePayrollPeriodRequest;
use App\Http\Requests\PayrollPeriod\UpdatePayrollPeriodRequest;
use App\Models\PayrollPeriod;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PayrollPeriodController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $payrollPeriods = PayrollPeriod::query()->get();

        return Inertia::render('PayrollPeriod/index',compact('payrollPeriods'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('PayrollPeriod/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePayrollPeriodRequest $request, CreateNewPayrollPeriod $action)
    {
        DB::beginTransaction();

        try {
            $action->create($request->validated());

            DB::commit();

            return redirect()->route('payroll-periods.index')->with('success', 'Payroll period created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(PayrollPeriod $payrollPeriod)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PayrollPeriod $payrollPeriod)
    {
        return Inertia::render('PayrollPeriod/edit', compact('payrollPeriod'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePayrollPeriodRequest $request, PayrollPeriod $payrollPeriod, UpdatePayrollPeriod $action)
    {
        DB::beginTransaction();

        try {
            $action->update($request->validated(), $payrollPeriod);

            DB::commit();

            return redirect()->route('payroll-periods.index')->with('success', 'Payroll period updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PayrollPeriod $payrollPeriod)
    {
        $payrollPeriod->delete();

        return redirect()->route('payroll-periods.index')->with('success', 'Payroll period deleted successfully.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Actions\PayrollPeriod\CreateNewPayrollPeriod;
use App\Actions\PayrollPeriod\UpdatePayrollPeriod;
use App\Enums\PayrollPeriodStatusEnum;
use App\Http\Requests\PayrollPeriod\StorePayrollPeriodRequest;
use App\Http\Requests\PayrollPeriod\UpdatePayrollPeriodRequest;
use App\Models\PayrollPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PayrollPeriodController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', PayrollPeriod::class);

        $payrollPeriods = PayrollPeriod::query()
            ->get([
                'id',
                'start_date',
                'end_date',
                'pay_date',
                'payroll_per_status',
            ]);

        $payroll_period_enums = PayrollPeriodStatusEnum::options();


        return Inertia::render('PayrollPeriod/index', compact('payrollPeriods', 'payroll_period_enums'));
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', PayrollPeriod::class);
        $payroll_period_enums = PayrollPeriodStatusEnum::options();
        return Inertia::render('PayrollPeriod/create', compact('payroll_period_enums'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePayrollPeriodRequest $request, CreateNewPayrollPeriod $action)
    {
        Gate::authorize('create', PayrollPeriod::class);

        if ($this->limit('create-payroll-period:' . auth()->id(), 60, 5)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        DB::beginTransaction();

        try {
            $action->create($request->validated());

            DB::commit();

            return redirect()->route('payroll-periods.index')->with('success', 'Payroll period created successfully.');
        } catch (\Exception $e) {
            dd($e);
            DB::rollBack();
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(PayrollPeriod $payrollPeriod)
    {
        Gate::authorize('view', $payrollPeriod);
        return Inertia::render('PayrollPeriod/show', compact('payrollPeriod'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PayrollPeriod $payrollPeriod)
    {
        Gate::authorize('update', $payrollPeriod);
        $payroll_period_enums = PayrollPeriodStatusEnum::options();
        return Inertia::render('PayrollPeriod/edit', compact('payrollPeriod', 'payroll_period_enums'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePayrollPeriodRequest $request, PayrollPeriod $payrollPeriod, UpdatePayrollPeriod $action)
    {
        Gate::authorize('update', $payrollPeriod);

        if ($this->limit('update-payroll-period:' . auth()->id(), 60, 5)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

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
        Gate::authorize('delete', $payrollPeriod);
        if ($this->limit('delete-payroll-period:' . auth()->id(), 60, 5)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        $payrollPeriod->delete();

        return redirect()->route('payroll-periods.index')->with('success', 'Payroll period deleted successfully.');
    }
}

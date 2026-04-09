<?php

namespace App\Http\Controllers;

use App\Actions\Incentive\CreateNewIncentive;
use App\Actions\Incentive\UpdateIncentive;
use App\Enums\PayrollPeriodStatusEnum;
use App\Http\Requests\Incentive\StoreIncentiveRequest;
use App\Http\Requests\Incentive\UpdateIncentiveRequest;
use App\Models\Employee;
use App\Models\Incentive;
use App\Models\PayrollPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class IncentiveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', Incentive::class);

        // Debug: Check payroll periods
        Log::info('=== PAYROLL PERIOD DEBUG ===');
        
        // First, get all payroll periods to see what's available
        $allPayrollPeriods = PayrollPeriod::query()->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
        Log::info('Total payroll periods: ' . $allPayrollPeriods->count());
        
        if ($allPayrollPeriods->count() > 0) {
            Log::info('Sample payroll period:', $allPayrollPeriods->first()->toArray());
            
            // Get distinct status values
            $statuses = PayrollPeriod::select('payroll_per_status')->distinct()->get();
            Log::info('Available payroll_per_status values: ', $statuses->pluck('payroll_per_status')->toArray());
        }
        
        // Get OPEN payroll periods
        $payroll_periods = PayrollPeriod::query()
            ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
            ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
        
        Log::info('Open payroll periods count: ' . $payroll_periods->count());
        
        // If no open periods, try to get all periods (for testing)
        if ($payroll_periods->count() === 0) {
            Log::warning('No OPEN payroll periods found. Getting all periods for testing.');
            $payroll_periods = PayrollPeriod::query()
                ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
            Log::info('All payroll periods count (fallback): ' . $payroll_periods->count());
        }

        // Get employees
        $employees = Employee::with('user')
            ->get(['id', 'emp_code', 'user_id'])
            ->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'emp_code' => $employee->emp_code,
                    'user' => $employee->user ? [
                        'name' => $employee->user->name
                    ] : null,
                ];
            });

        Log::info('Employees count: ' . $employees->count());

        $incentives = Incentive::query()
            ->with([
                'payroll_period',
                'employees',
                'employees.user',
                'employees.position',
                'employees.branch'
            ])
            ->get([
                'id',
                'payroll_period_id',
                'incentive_name',
                'incentive_amount'
            ]);
            
        return Inertia::render('incentives/index', [
            'incentives' => $incentives,
            'payroll_periods' => $payroll_periods,
            'employees' => $employees,
            'editingIncentive' => null,
            'isEditing' => false
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreIncentiveRequest $request, CreateNewIncentive $incentive)
    {
        Gate::authorize('create', Incentive::class);
        DB::beginTransaction();
        try {
            $incentive->create($request->validated());
            DB::commit();
            return redirect()->route('incentives.index')->with('success', 'Incentive created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('incentives.index')->with('error', 'Failed to create incentive: ' . $e->getMessage());
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Incentive $incentive)
    {
        Gate::authorize('update', $incentive);
        $incentive->load('payroll_period', 'employees');
        
        // Get payroll periods (same logic as index)
        $payroll_periods = PayrollPeriod::query()
            ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
            ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
        
        // Fallback if no open periods
        if ($payroll_periods->count() === 0) {
            $payroll_periods = PayrollPeriod::query()
                ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
        }
        
        $employees = Employee::with('user')
            ->get(['id', 'emp_code', 'user_id'])
            ->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'emp_code' => $employee->emp_code,
                    'user' => $employee->user ? [
                        'name' => $employee->user->name
                    ] : null,
                ];
            });

        return Inertia::render('incentives/index', [
            'editingIncentive' => $incentive,
            'employees' => $employees,
            'payroll_periods' => $payroll_periods,
            'isEditing' => true
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateIncentiveRequest $request, Incentive $incentive, UpdateIncentive $updateincentive)
    {
        Gate::authorize('update', $incentive);
        DB::beginTransaction();
        try {
            $updateincentive->update($request->validated(), $incentive);
            DB::commit();
            return redirect()->route('incentives.index')->with('success', 'Incentive updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('incentives.index')->with('error', 'Failed to update incentive: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Incentive $incentive)
    {
        Gate::authorize('delete', $incentive);
        
        DB::beginTransaction();
        try {
            $incentive->delete();
            DB::commit();
            return redirect()->route('incentives.index')->with('success', 'Incentive deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('incentives.index')->with('error', 'Failed to delete incentive: ' . $e->getMessage());
        }
    }
}
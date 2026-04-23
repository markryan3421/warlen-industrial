<?php

namespace App\Http\Controllers;

use App\Actions\Deduction\CreateNewDeduction;
use App\Actions\Deduction\UpdateDeduction;
use App\Enums\PayrollPeriodStatusEnum;
use App\Http\Requests\Deduction\StoreDeductionRequest;
use App\Http\Requests\Deduction\UpdateDeductionRequest;
use App\Models\Employee;
use App\Models\Deduction;
use App\Models\PayrollPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class DeductionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Deduction::class);

        $search = $request->input('search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $perPage = $request->input('per_page', 10);

        $deductionsQuery = Deduction::query()
            ->with([
                'payroll_period',
                'employees',
                'employees.user',
                'employees.position',
                'employees.branch'
            ])
            ->orderBy('created_at', 'desc');

        if ($search) {
            $deductionsQuery->where('deduction_name', 'like', '%' . $search . '%');
        }

        if ($dateFrom) {
            $deductionsQuery->whereHas('payroll_period', function ($query) use ($dateFrom) {
                $query->whereDate('start_date', '>=', $dateFrom);
            });
        }

        if ($dateTo) {
            $deductionsQuery->whereHas('payroll_period', function ($query) use ($dateTo) {
                $query->whereDate('end_date', '<=', $dateTo);
            });
        }

        $deductions = $deductionsQuery->paginate($perPage);

        if ($search) $deductions->appends('search', $search);
        if ($dateFrom) $deductions->appends('date_from', $dateFrom);
        if ($dateTo) $deductions->appends('date_to', $dateTo);
        $deductions->appends('per_page', $perPage);

        $payroll_periods = PayrollPeriod::query()
            ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
            ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);

        if ($payroll_periods->count() === 0) {
            $payroll_periods = PayrollPeriod::query()
                ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
        }

        $employees = Employee::with('user')
            ->where('employee_status', 'active')
            ->get(['id', 'emp_code', 'user_id'])
            ->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'emp_code' => $employee->emp_code,
                    'user' => $employee->user ? ['name' => $employee->user->name] : null,
                ];
            });

        return Inertia::render('deductions/index', [
            'deductions' => $deductions,
            'payroll_periods' => $payroll_periods,
            'employees' => $employees,
            'editingDeduction' => null,
            'isEditing' => false,
            'filters' => [
                'search' => $search,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'page' => $deductions->currentPage(),
                'per_page' => $perPage,
            ]
        ]);
    }

    public function create()
    {
        $payroll_periods = PayrollPeriod::query()
            ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
            ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);

        $employees = Employee::with('user')
            ->get(['id', 'emp_code', 'user_id'])
            ->map(fn($e) => [
                'id' => $e->id,
                'emp_code' => $e->emp_code,
                'user' => $e->user ? ['name' => $e->user->name] : null,
            ]);

        return Inertia::render('deductions/create', [
            'payroll_periods' => $payroll_periods,
            'employees' => $employees,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreDeductionRequest $request, CreateNewDeduction $deduction)
    {
        Gate::authorize('create', Deduction::class);
        DB::beginTransaction();
        try {
            $deduction->create($request->validated());
            DB::commit();
            return redirect()->route('deductions.index')->with('success', 'Deduction created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('deductions.index')->with('error', 'Failed to create deduction: ' . $e->getMessage());
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Deduction $deduction)
    {
        $deduction->load('employees');

        $payroll_periods = PayrollPeriod::query()
            ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
            ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);

        $employees = Employee::with('user')
            ->get(['id', 'emp_code', 'user_id'])
            ->map(fn($e) => [
                'id' => $e->id,
                'emp_code' => $e->emp_code,
                'user' => $e->user ? ['name' => $e->user->name] : null,
            ]);

        return Inertia::render('deductions/edit', [
            'deduction' => [
                'id' => $deduction->id,
                'deduction_name' => $deduction->deduction_name,
                'deduction_amount' => $deduction->deduction_amount,
                'payroll_period_id' => $deduction->payroll_period_id,
                'employees' => $deduction->employees->map(fn($e) => ['id' => $e->id]),
            ],
            'payroll_periods' => $payroll_periods,
            'employees' => $employees,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateDeductionRequest $request, Deduction $deduction, UpdateDeduction $updateDeduction)
    {
        Gate::authorize('update', $deduction);
        DB::beginTransaction();
        try {
            $updateDeduction->update($request->validated(), $deduction);
            DB::commit();
            return redirect()->route('deductions.index')->with('success', 'Deduction updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('deductions.index')->with('error', 'Failed to update deduction: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Deduction $deduction)
    {
        Gate::authorize('delete', $deduction);

        DB::beginTransaction();
        try {
            $deduction->delete();
            DB::commit();
            return redirect()->route('deductions.index')->with('error', 'Deduction deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('deductions.index')->with('error', 'Failed to delete deduction: ' . $e->getMessage());
        }
    }
}

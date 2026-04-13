<?php

namespace App\Http\Controllers;

use App\Actions\Deduction\CreateNewDeduction;
use App\Actions\Deduction\UpdateDeduction;
use App\Http\Requests\Deduction\StoreDeductionRequest;
use App\Models\Deduction;
use App\Models\PayrollPeriod;
use App\Repository\IncentiveRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DeductionController extends Controller
{
    public function __construct(protected IncentiveRepository $deductionRepository) {}
    
    public function index()
    {
        Gate::authorize('viewAny', Deduction::class);

        $deductions = $this->deductionRepository->getDeductions();

        // Get ALL payroll periods without status filter
        $payroll_periods = PayrollPeriod::query()
            ->select('id', 'start_date', 'end_date', 'pay_date')
            ->get();

        $employees = $this->deductionRepository->getEmployees();

        return Inertia::render('deductions/index', [
            'deductions' => $deductions,
            'payroll_periods' => $payroll_periods,
            'employees' => $employees,
        ]);
    }

    public function create()
    {
        // This can be removed or kept for backward compatibility
        Gate::authorize('create', Deduction::class);

        $payroll_periods = $this->deductionRepository->getOpenPayrollPeriods();
        $employees = $this->deductionRepository->getEmployees();

        return Inertia::render('deductions/create', compact('payroll_periods', 'employees'));
    }

    public function store(CreateNewDeduction $action, StoreDeductionRequest $request)
    {
        Gate::authorize('create', Deduction::class);

        if ($this->limit('create-deduction:' . auth()->id(), 60, 15)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        try {
            DB::beginTransaction();

            $action->create($request->validated());

            DB::commit();

            return to_route('deductions.index')->with('success', 'Deduction created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to create deduction. Please try again.' . $e->getMessage());
        }
    }

    public function edit(Deduction $deduction)
    {
        Gate::authorize('update', $deduction);

        $deduction->load('payroll_period', 'employees');

        $employees = $this->deductionRepository->getEmployees();
        $payroll_periods = $this->deductionRepository->getOpenPayrollPeriods();

        return Inertia::render('deductions/update', [
            'deduction' => $deduction,
            'employees' => $employees,
            'payroll_periods' => $payroll_periods
        ]);
    }

    public function show()
    {
        return Inertia::render('deductions/show');
    }

    public function update(UpdateDeduction $action, StoreDeductionRequest $request, Deduction $deduction)
    {
        Gate::authorize('update', $deduction);

        if ($this->limit('update-deduction:' . auth()->id(), 60, 15)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        try {
            DB::beginTransaction();

            $action->update($request->validated(), $deduction);

            DB::commit();

            return to_route('deductions.index')->with('success', 'Deduction updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to update deduction. Please try again.' . $e->getMessage());
        }
    }

    public function destroy(Deduction $deduction)
    {
        Gate::authorize('delete', $deduction);
        if ($this->limit('delete-deduction:' . auth()->id(), 60, 15)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        try {
            DB::beginTransaction();

            $deduction->delete();

            DB::commit();

            return to_route('deductions.index')->with('success', 'Deduction deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to delete deduction. Please try again.' . $e->getMessage());
        }
    }
}

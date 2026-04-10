<?php

namespace App\Http\Controllers\HrRole;

use App\Actions\Deduction\CreateNewDeduction;
use App\Actions\Deduction\UpdateDeduction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Deduction\StoreDeductionRequest;
use App\Models\Deduction;
use App\Repository\IncentiveRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class HRDeductionController extends Controller
{
    public function __construct(protected IncentiveRepository $deductionRepository) {}
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', Deduction::class);

        $deductions = $this->deductionRepository->getDeductions();

        return Inertia::render('HR/deductions/index', compact('deductions'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', Deduction::class);

        $payroll_periods = $this->deductionRepository->getOpenPayrollPeriods();

        $employees = $this->deductionRepository->getActiveEmployeesForIncentive();

        return Inertia::render('HR/deductions/create', compact('payroll_periods', 'employees'));
    }

    /**
     * Store a newly created resource in storage.
     */
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

            return to_route('hr.deductions.index')->with('success', 'Branch and site created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to create deduction. Please try again.' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id) {}

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Deduction $deduction)
    {
        Gate::authorize('update', $deduction);

        $deduction->load('payroll_period', 'employees');

        $employees = $this->deductionRepository->getActiveEmployeesForIncentive();

        $payroll_periods = $this->deductionRepository->getOpenPayrollPeriods();

        return Inertia::render('HR/deductions/edit', [
            'deduction' => $deduction,
            'employees' => $employees,
            'payroll_periods' => $payroll_periods
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
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

            return to_route('hr.deductions.index')->with('success', ' Deduction updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to update deduction. Please try again.' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
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

            return to_route('hr.deductions.index')->with('success', ' Deduction deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to delete deduction. Please try again.' . $e->getMessage());
        }
    }
}

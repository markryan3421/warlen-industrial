<?php

namespace App\Http\Controllers;

use App\Actions\Deduction\CreateNewDeduction;
use App\Actions\Deduction\UpdateDeduction;
use App\Enums\PayrollPeriodStatusEnum;
use App\Http\Requests\Deduction\StoreDeductionRequest;
use App\Models\Deduction;
use App\Models\Employee;
use App\Models\PayrollPeriod;
// use GuzzleHttp\Promise\Create;
// use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class DeductionController extends Controller
{
    
    public function index()
    {
        Gate::authorize('viewAny', Deduction::class);

        $payroll_periods = PayrollPeriod::query()
            ->get([
                'id',
                'start_date',
                'end_date',
                'pay_date',
                'payroll_per_status',
            ]);
        $deductions = Deduction::query()
            ->with(['payroll_period', 'employees', 'employees.user', 'employees.position', 'employees.branch'])
            ->get(['id', 'payroll_period_id', 'deduction_name', 'deduction_amount']);

        return Inertia::render('deductions/index', compact('payroll_periods', 'deductions'));
    }

    public function create()
    {
        Gate::authorize('create', Deduction::class);

        $payroll_periods = PayrollPeriod::query()
            ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
            ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);

        $employees = Employee::with('user')->where('employee_status', 'active')->get();
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

            $this->cacheForget('deductions');

            DB::commit();

            return to_route('deductions.index')->with('success', 'Branch and site created successfully.');
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
        $employees = Employee::with('user')->where('employee_status', 'active')->get();


        $payroll_periods = PayrollPeriod::query()->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)->get();

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

    public function update(UpdateDeduction $action, StoreDeductionRequest $request , Deduction $deduction)
    {
        Gate::authorize('update', $deduction);

        if ($this->limit('update-deduction:' . auth()->id(), 60, 15)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        try {
            DB::beginTransaction();

            $action->update($request->validated(), $deduction);

            $this->cacheForget('deductions');

            DB::commit();

            return to_route('deductions.index')->with('success', ' Deduction updated successfully.');
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

            $this->cacheForget('deductions');

            DB::commit();

            return to_route('deductions.index')->with('success', ' Deduction deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to delete deduction. Please try again.' . $e->getMessage());
        }
    }
}

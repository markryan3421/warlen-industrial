<?php

namespace App\Http\Controllers\HrRole;

use App\Actions\Incentive\CreateNewIncentive;
use App\Actions\Incentive\UpdateIncentive;
use App\Enums\PayrollPeriodStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Incentive\StoreIncentiveRequest;
use App\Http\Requests\Incentive\UpdateIncentiveRequest;
use App\Models\Employee;
use App\Models\Incentive;
use App\Models\PayrollPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class HRIncentiveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', Incentive::class);

        $payroll_periods = $this->cacheRemember('payroll_periods', 60, function () {
            return PayrollPeriod::query()
                ->get([
                    'id',
                    'start_date',
                    'end_date',
                    'pay_date',
                    'payroll_per_status',
                ]);
        });

        $incentives = $this->cacheRemember('incentives', 60, function () {
            return Incentive::with(['payroll_period', 'employees', 'employees.user', 'employees.position', 'employees.branch'])->get();
        });


        return Inertia::render('HR/incentives/index', compact('incentives', 'payroll_periods'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', Incentive::class);
        $payroll_periods = $this->cacheRemember('payroll_periods', 60, function () {
            PayrollPeriod::query()
                ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
                ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
        });

        $employees = $this->cacheRemember('employees', 60, function () {
            return Employee::with('user')->where('employee_status', 'active')->get();
        });

        return Inertia::render('HR/incentives/create', compact('payroll_periods', 'employees'));
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
            $this->cacheForget('incentives');
            $this->cacheForget('payroll_periods');
            $this->cacheForget('employees');
            return redirect()->route('hr.incentives.index')->with('success', 'Incentive created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
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
    public function edit(Incentive $incentive)
    {
        Gate::authorize('update', $incentive);
        $incentive->load('payroll_period', 'employees');

        $payroll_periods = $this->cacheRemember('payroll_periods', 60, function () {
            return PayrollPeriod::query()
                ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
                ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
        });

        $employees = $this->cacheRemember('employees', 60, function () {
            return Employee::with('user')->where('employee_status', 'active')->get();
        });

        return Inertia::render('HR/incentives/update', [
            'incentive' => $incentive,
            'employees' => $employees,
            'payroll_periods' => $payroll_periods
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateIncentiveRequest $request, Incentive $incentive,  UpdateIncentive $updateincentive)
    {
        Gate::authorize('update', $incentive);

        DB::beginTransaction();

        try {
            $updateincentive->update($request->validated(), $incentive);
            DB::commit();
            $this->cacheForget('incentives');
            $this->cacheForget('payroll_periods');
            $this->cacheForget('employees');
            return redirect()->route('hr.incentives.index')->with('success', 'Incentive updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Incentive $incentive)
    {
        Gate::authorize('delete', $incentive);
        $incentive->delete();
        $this->cacheForget('incentives');
        $this->cacheForget('payroll_periods');
        $this->cacheForget('employees');
        return redirect()->route('hr.incentives.index')->with('success', 'Incentive deleted successfully.');
    }
}

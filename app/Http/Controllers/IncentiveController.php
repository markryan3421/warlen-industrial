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

class IncentiveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', Incentive::class);

        $payroll_periods = PayrollPeriod::query()
            ->get([
                'id',
                'start_date',
                'end_date',
                'pay_date',
                'payroll_per_status',
            ]);

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
        return Inertia::render('incentives/index', compact('incentives', 'payroll_periods'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', Incentive::class);

        $payroll_periods = PayrollPeriod::query()
            ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
            ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);

        $employees = Employee::with('user')->where('employee_status', 'active')->get();

        return Inertia::render('incentives/create', compact('payroll_periods', 'employees'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreIncentiveRequest $request, CreateNewIncentive $incentive)
    {
        Gate::authorize('create', Incentive::class);
        $incentive->create($request->validated());
       // DB::commit();
        return redirect()->route('incentives.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(Incentive $incentive)
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
        $employees = Employee::with('user')->where('employee_status', 'active')->get();


        $payroll_periods = PayrollPeriod::query()->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)->get();

        return Inertia::render('incentives/update', [
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
        $updateincentive->update($request->validated(), $incentive);
        //DB::commit();
        return redirect()->route('incentives.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Incentive $incentive)
    {
        Gate::authorize('delete', $incentive);

        $incentive->delete();
       //7 9 DB::commit();
        return redirect()->route('incentives.index');
    }
}

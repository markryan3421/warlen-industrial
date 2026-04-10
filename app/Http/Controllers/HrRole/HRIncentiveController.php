<?php

namespace App\Http\Controllers\HrRole;

use App\Actions\Incentive\CreateNewIncentive;
use App\Actions\Incentive\UpdateIncentive;
use App\Http\Controllers\Controller;
use App\Http\Requests\Incentive\StoreIncentiveRequest;
use App\Http\Requests\Incentive\UpdateIncentiveRequest;
use App\Models\Incentive;
use App\Repository\IncentiveRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class HRIncentiveController extends Controller
{
    public function __construct(protected IncentiveRepository $incentiveRepository) {}
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', Incentive::class);

        $incentives = $this->incentiveRepository->getIncentives();

        return Inertia::render('HR/incentives/index', compact('incentives'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', Incentive::class);
        $payroll_periods = $this->incentiveRepository->getOpenPayrollPeriods();

        $employees =  $this->incentiveRepository->getActiveEmployeesForIncentive();

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

        $payroll_periods = $this->incentiveRepository->getOpenPayrollPeriods();

        $employees = $this->incentiveRepository->getActiveEmployeesForIncentive();
    
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
        
        return redirect()->route('hr.incentives.index')->with('success', 'Incentive deleted successfully.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Actions\Incentive\CreateNewIncentive;
use App\Actions\Incentive\UpdateIncentive;
use App\Http\Requests\Incentive\StoreIncentiveRequest;
use App\Http\Requests\Incentive\UpdateIncentiveRequest;
use App\Models\Incentive;
use App\Repository\IncentiveRepository;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class IncentiveController extends Controller
{

    public function __construct(protected IncentiveRepository $incentiveRepository) {}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', Incentive::class);

        $incentives = $this->incentiveRepository->getIncentives();
       
        return Inertia::render('incentives/index', compact('incentives'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', Incentive::class);

        $payroll_periods = $this->incentiveRepository->getOpenPayrollPeriods();

        $employees = $this->incentiveRepository->getActiveEmployeesForIncentive();

        return Inertia::render('incentives/create', compact('payroll_periods', 'employees'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreIncentiveRequest $request, CreateNewIncentive $incentive)
    {
        Gate::authorize('create', Incentive::class);
        $incentive->create($request->validated());

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

        $payroll_periods = $this->incentiveRepository->getOpenPayrollPeriods();

        $employees = $this->incentiveRepository->getActiveEmployeesForIncentive();

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

        $this->cacheForget([
            'incentives',
            'payroll_periods',
        ]);

        return redirect()->route('incentives.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Incentive $incentive)
    {
        Gate::authorize('delete', $incentive);

        $incentive->delete();
        
        return redirect()->route('incentives.index');
    }
}

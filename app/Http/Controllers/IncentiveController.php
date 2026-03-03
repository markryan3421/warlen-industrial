<?php

namespace App\Http\Controllers;

use App\Actions\Incentive\CreateNewIncentive;
use App\Actions\Incentive\UpdateIncentive;
use App\Http\Requests\Incentive\StoreIncentiveRequest;
use App\Http\Requests\Incentive\UpdateIncentiveRequest;
use App\Models\Employee;
use App\Models\Incentive;
use App\Models\PayrollPeriod;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class IncentiveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $incentives = Incentive::with('payroll_period')->get();
        return Inertia::render('incentives/index', compact('incentives'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $payroll_periods = PayrollPeriod::all();
        $employees = Employee::with('user')->get();
        return Inertia::render('incentives/create', compact('payroll_periods','employees' ));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreIncentiveRequest $request, CreateNewIncentive $incentive )
    {
        $incentive->create($request->validated());
        DB::commit();
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
    
        return Inertia::render('incentives/update', compact('incentive'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateIncentiveRequest $request,Incentive $incentive,  UpdateIncentive $updateincentive)
    {
        $updateincentive->update($request->validated(), $incentive);
        DB::commit();
        return redirect()->route('incentives.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Incentive $incentive)
    {
        $incentive->delete();
        DB::commit();
        return redirect()->route('incentives.index');
    }
}

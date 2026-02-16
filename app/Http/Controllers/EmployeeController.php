<?php

namespace App\Http\Controllers;

use App\Actions\Employee\CreateNewEmployee;
use App\Actions\Employee\UpdateEmployee;
use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Models\Employee;
use App\Models\Position;
use App\Models\BranchOrSite;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $employees = Employee::with(['position', 'branch_or_site', 'user'])
            ->latest()
            ->paginate(10); 
            
        return Inertia::render('employees/index', [
            'employees' => $employees
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        // Load data for dropdowns
        $positions = Position::all();
        $branches = BranchOrSite::all();
        
        return Inertia::render('employees/create', [
            'positions' => $positions,
            'branches' => $branches
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEmployeeRequest $request, CreateNewEmployee $action)
    {
        DB::beginTransaction();

        try {
            $validatedData = $request->validated();
            $action->create($validatedData, $request->user()); // This creates both user and employee

            DB::commit();

            return to_route('employees.index')->with('success', 'Employee created successfully.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Employee $employee)
    {
        $employee->load(['position', 'branch_or_site', 'user']);
        
        return Inertia::render('employees/show', [
            'employee' => $employee
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Employee $employee)
    {
        // Load data for dropdowns
        $positions = Position::all();
        $branches = BranchOrSite::all();
        
        return Inertia::render('employees/edit', [
            'employee' => $employee,
            'positions' => $positions,
            'branches' => $branches
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEmployeeRequest $request, Employee $employee, UpdateEmployee $action)
    {
        DB::beginTransaction();

        try {
            $validatedData = $request->validated();
            $action->update($validatedData, $employee);
            
            DB::commit();
            
            return to_route('employees.index')->with('success', 'Employee updated successfully.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Employee $employee)
    {
        DB::beginTransaction();
        
        try {
            if ($employee->user) {
                $employee->user->delete();
            }
            
            $employee->delete();
            DB::commit();
            
            return to_route('employees.index')->with('success', 'Employee deleted successfully.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
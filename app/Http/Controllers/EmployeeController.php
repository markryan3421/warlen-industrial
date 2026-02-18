<?php

namespace App\Http\Controllers;

use App\Actions\Employee\CreateNewEmployee;
use App\Actions\Employee\UpdateEmployee;
use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Position;
use App\Models\Site;
use App\Repository\EmployeeRepository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EmployeeController extends Controller
{

    public function __construct(private EmployeeRepository $employeeRepository) {}
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $employees = Cache::remember('employees', 60, function () {
            return  $this->employeeRepository->getEmployees();
        });

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
        $positions = Position::query()
            ->get(['id', 'pos_name']);

        $branches = Branch::query()
            ->get(['id', 'branch_name']);
       

        return Inertia::render('employees/create', [
            'positions' => $positions,
            'branches' => $branches,
            'sites' => Site::with('branch')->get(),
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

            $action->create($validatedData);

            Cache::forget('employees');

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
        $employee->load(['position', 'branch', 'user', 'sites']);

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
        $positions = Position::query()
            ->get(['id', 'pos_name']);

        $branches = Branch::query()
            ->get(['id', 'branch_name']);
        


        $employee->load(['position', 'branch', 'user', 'sites']);

        return Inertia::render('employees/update', [
            'employee' => $employee,
            'positions' => $positions,
            'branches' => $branches,
            'sites' => Site::with('branch')->get(['id','branch_id', 'site_name']),
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

            Cache::forget('employees');

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
        $employee->user()->delete();

        Cache::forget('employees');

        return to_route('employees.index')->with('success', 'Employee deleted successfully.');  
    }
}

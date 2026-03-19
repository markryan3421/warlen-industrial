<?php

namespace App\Http\Controllers\HrRole;

use App\Actions\Employee\CreateNewEmployee;
use App\Actions\Employee\UpdateEmployee;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Position;
use App\Models\Site;
use App\Repository\EmployeeRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class HREmployeeController extends Controller
{
    public function __construct(private EmployeeRepository $employeeRepository) {}
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Gate::authorize('viewAny', Employee::class);

        // $employees = $this->cacheRemember('employees', 60, function () {
        //     return $this->employeeRepository->getEmployees();
        // });
        $employees = $this->employeeRepository->getEmployees();
        $branchesWithSites = $this->employeeRepository->getBranchesWithSites();


        return Inertia::render('HR/employees/index', [
            'employees' => $employees,
            'branchesData' => $branchesWithSites
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', Employee::class);
        // Load data for dropdowns
        $positions = Position::query()
            ->get(['id', 'pos_name']);

        $branches = Branch::query()
            ->get(['id', 'branch_name']);


        return Inertia::render('HR/employees/create', [
            'positions' => $positions,
            'branches' => $branches,
            'site' => Site::with('branch')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEmployeeRequest $request, CreateNewEmployee $action)
    {
        Gate::authorize('create', Employee::class);

        if ($this->limit('create-employee:' . auth()->id(), 60, 25)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        DB::beginTransaction();

        try {
            $validatedData = $request->validated();

            $action->create($validatedData);

            $this->cacheForget('employees');

            DB::commit();

            return to_route('hr.employees.index')->with('success', 'Employee created successfully.');
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
        Gate::authorize('view', $employee);

        $employee->load(['position', 'branch', 'user', 'site']);

        return Inertia::render('HR/employees/show', [
            'employee' => $employee
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Employee $employee)
    {
        Gate::authorize('update', $employee);
        // Load data for dropdowns
        $positions = Position::query()
            ->get(['id', 'pos_name']);

        //dd($employee);

        $branches = Branch::query()
            ->get(['id', 'branch_name']);

        $employee->load(['position', 'branch', 'user' => fn($query) => $query->getUserName(), 'sites']);

        return Inertia::render('HR/employees/update', [
            'employee' => $employee,
            'positions' => $positions,
            'branches' => $branches,
            'site' => Site::with('branch')->get(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateEmployeeRequest $request, Employee $employee, UpdateEmployee $action)
    {
        Gate::authorize('update', $employee);

        if ($this->limit('update-employee:' . auth()->id(), 60, 25)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        DB::beginTransaction();

        try {
            $validatedData = $request->validated();
            // dd($validatedData);
            $action->update($validatedData, $employee);

            // $this->cacheForget('employees');
            Cache::forget('employees');

            DB::commit();

            return to_route('hr.employees.index')->with('success', 'Employee updated successfully.');
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
        Gate::authorize('delete', $employee);

        if ($this->limit('delete-employee:' . auth()->id(), 60, 10)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        $employee->user()->delete();

        $this->cacheForget('employees');

        return to_route('hr.employees.index')->with('success', 'Employee deleted successfully.');
    }
}

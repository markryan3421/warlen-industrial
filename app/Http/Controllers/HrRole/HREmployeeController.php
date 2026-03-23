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
use App\Traits\HasPaginatedIndex;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class HREmployeeController extends Controller
{
    use HasPaginatedIndex;
    public function __construct(private EmployeeRepository $employeeRepository) {}
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Employee::class);
        // Full unfiltered collection — cached
        $employees = $this->cacheRemember('employees', 60, function () {
            return $this->employeeRepository->getEmployees();
        });

        // ── Derive allPositions from the FULL collection (before filtering) ──────
        // This gives the Position popover the complete list of options regardless
        // of what filters are currently active or what page the user is on.
        $allPositions = $employees
            ->map(fn($e) => optional($e->position)->pos_name)
            ->filter()           // remove nulls
            ->unique()
            ->sort()
            ->values()
            ->all();

        // ── Paginate + filter — the trait now handles all filter params ──────────
        $result = $this->paginateCollection(
            items: collect($employees),
            request: $request,
            searchColumns: [
                'emp_code',
                'user.name',
                'position.pos_name',
                'branch.branch_name',
                'site.site_name',
                'employee_status',
            ],
        );

        $branchesWithSites = $this->cacheRemember('branchesWithSites', 60, function () {
            return $this->employeeRepository->getBranchesWithSites();
        });

        return Inertia::render('HR/employees/index', [
            'employees' => [
                'data'    => $result['data'],
                'links'   => $result['pagination']['links'] ?? [],
                'from'    => $result['pagination']['from']  ?? 0,
                'to'      => $result['pagination']['to']    ?? 0,
                'total'   => $result['pagination']['total'] ?? 0,
                'perPage' => (int) ($request->perPage ?? 10),
            ],
            'branchesData'  => $branchesWithSites,
            'allPositions'  => $allPositions,          // ← NEW
            'filters'       => $result['filters'],     // now includes branch/site/status/positions/dates
            'totalCount'    => $result['totalCount'],
            'filteredCount' => $result['filteredCount'],
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

        if ($this->limit('hr-create-employee:' . auth()->id(), 60, 25)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        DB::beginTransaction();

        try {
            $validatedData = $request->validated();

            $action->create($validatedData);

            $this->cacheForget('hr-employees');

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

        if ($this->limit('-hrupdate-employee:' . auth()->id(), 60, 25)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        DB::beginTransaction();

        try {
            $validatedData = $request->validated();
            // dd($validatedData);
            $action->update($validatedData, $employee);

            // $this->cacheForget('employees');
            Cache::forget('hr-employees');

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

        if ($this->limit('hr-delete-employee:' . auth()->id(), 60, 10)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        $employee->user()->delete();

        $this->cacheForget('hr-employees');

        return to_route('hr.employees.index')->with('success', 'Employee deleted successfully.');
    }
}

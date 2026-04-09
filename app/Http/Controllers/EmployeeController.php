<?php

namespace App\Http\Controllers;

use App\Actions\Employee\CreateNewEmployee;
use App\Actions\Employee\UpdateEmployee;
use App\Concerns\ManageSession;
use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Position;
use App\Models\Site;
use Illuminate\Http\Request;
use App\Repository\EmployeeRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use App\Traits\HasPaginatedIndex;

class EmployeeController extends Controller
{
    use HasPaginatedIndex, ManageSession;

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

        $archivedEmployees = $this->employeeRepository->getDeletedEmployees();

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

        return Inertia::render('employees/index', [
            'archivedEmployees' => $archivedEmployees,
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


        return Inertia::render('employees/create', [
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
        Gate::authorize('view', $employee);

        $employee->load([
            'position' => fn($query) => $query->getPosition(),
            'branch' => fn($query) => $query->getBranch(),
            'user' => fn($query) => $query->getUserName(),
            'sites' => fn($query) => $query->getSiteName(),
        ]);

        return Inertia::render('employees/show', [
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

        $employee->load([
            'position' => fn($query) => $query->getPosition(),
            'branch' => fn($query) => $query->getBranch(),
            'user' => fn($query) => $query->getUserName(),
            'sites' => fn($query) => $query->getSiteName(),
        ]);

        return Inertia::render('employees/update', [
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

            $action->update($validatedData, $employee);

            if (isset($validatedData['password']) && !empty($validatedData['password'])) {
                $this->invalidateUserSessions($employee->user_id);
            }

            DB::commit();

            $this->cacheForget('employees');

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
        Gate::authorize('delete', $employee);

        if ($this->limit('delete-employee:' . auth()->id(), 60, 10)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        // $this->invalidateUserSessions($employee->user_id);
       // $employee->update(['employee_status' => 'inactive']);
        $employee->delete();

        $this->cacheForget('employees');

        return to_route('employees.index')->with('success', 'Employee deleted successfully.');
    }
}

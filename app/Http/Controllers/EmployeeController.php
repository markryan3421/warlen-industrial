<?php

namespace App\Http\Controllers;

use App\Actions\Employee\CreateNewEmployee;
use App\Actions\Employee\UpdateEmployee;
use App\Concerns\ManageSession;
use App\Http\Requests\Employee\BulkAssignBranchSiteRequest;
use App\Http\Requests\Employee\BulkAssignPositionRequest;
use App\Http\Requests\Employee\StoreEmployeeRequest;
use App\Http\Requests\Employee\UpdateEmployeeRequest;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Position;
use App\Models\Site;
use App\Repository\EmployeeRepository;
use App\Traits\HasPaginatedIndex;
use Illuminate\Http\Request;
// use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

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

        $employees = $this->cacheRemember('employees', 60, fn() => $this->employeeRepository->getEmployees());
        $archived = $this->employeeRepository->getDeletedEmployees();

        $allPositions = $employees->pluck('position.pos_name')->filter()->unique()->sort()->values()->all();

        $result = $this->paginateCollection(
            items: collect($employees),
            request: $request,
            searchColumns: ['emp_code', 'user.name', 'position.pos_name', 'branch.branch_name', 'site.site_name', 'employee_status'],
        );

        // Only branches that have active employees (with their sites)
        $activeBranchesData = Branch::whereIn('id', $employees->pluck('branch.id'))->with('sites')->get();
        // Only branches that have archived employees
        $archivedBranchesData = Branch::whereIn('id', $archived->pluck('branch.id'))->with('sites')->get();

        return Inertia::render('employees/index', [
            'archivedEmployees' => $archived,
            'employees' => [
                'data'    => $result['data'],
                'links'   => $result['pagination']['links'] ?? [],
                'from'    => $result['pagination']['from']  ?? 0,
                'to'      => $result['pagination']['to']    ?? 0,
                'total'   => $result['pagination']['total'] ?? 0,
                'perPage' => (int) ($request->perPage ?? 10),
            ],
            'activeBranchesData'   => $activeBranchesData,
            'archivedBranchesData' => $archivedBranchesData,
            'allPositions'         => $allPositions,
            'filters'              => $result['filters'],
            'totalCount'           => $result['totalCount'],
            'filteredCount'        => $result['filteredCount'],
            'positionsList'        => Position::select('id', 'pos_name')->get(),
            'allBranchesForAssign' => Branch::select('id', 'branch_name')->get(), // keep all for bulk assign
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

        $this->invalidateUserSessions($employee->user_id);
        $employee->update(['employee_status' => 'inactive']);
        $employee->delete();

        $this->cacheForget('employees');

        return to_route('employees.index')->with('success', 'Employee deleted successfully.');
    }
    public function bulkDestroy(Request $request)
    {
        Gate::authorize('bulkDelete', Employee::class);

        if ($this->limit('bulk-destroy:' . auth()->id(), 60, 10)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        $ids = $request->input('ids') ?? $request->json('ids');
        if (empty($ids)) {
            return back()->with('error', 'No employees selected.');
        }

        DB::transaction(function () use ($ids) {
            Employee::whereIn('id', $ids)->each(function ($employee) {
                $this->invalidateUserSessions($employee->user_id);
                $employee->update(['employee_status' => 'inactive']);
                $employee->delete(); // soft delete
            });
        });

        $this->cacheForget('employees');
        return to_route('employees.index')->with('success', count($ids) . ' employees moved to archive.');
    }

    public function bulkRestore(Request $request)
    {
        Gate::authorize('bulkRestore', Employee::class);

        if ($this->limit('restore-employee:' . auth()->id(), 60, 10)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        $ids = $request->input('ids') ?? $request->json('ids');
        if (empty($ids)) {
            return back()->with('error', 'No archived employees selected.');
        }

        Employee::withTrashed()->whereIn('id', $ids)->each(function ($employee) {
            $employee->update(['employee_status' => 'active']);
            $employee->restore();
        });

        $this->cacheForget('employees');
        return to_route('employees.index')->with('success', count($ids) . ' employees restored.');
    }

    public function restore(Employee $employee)   // $employee is resolved by slug_emp automatically if route binding is set up
    {
        Gate::authorize('restore', $employee);

        if ($this->limit('restore-employee-single:' . auth()->id(), 60, 10)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        $employee->update(['employee_status' => 'active']);
        $employee->restore();

        $this->cacheForget('employees');

        return to_route('employees.index')->with('success', 'Employee restored.');
    }

    public function bulkAssignPosition(BulkAssignPositionRequest $request)
    {
        Gate::authorize('bulkAssign', Employee::class);

        if ($this->limit('bulk-assign-position:' . auth()->id(), 60, 10)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        $position = Position::findOrFail($request->position_id);

        $updatedCount = Employee::whereIn('id', $request->ids)
            ->whereNull('position_id')
            ->update(['position_id' => $position->id]);

        $this->cacheForget('employees');

        $message = $updatedCount > 0
            ? "Position assigned to {$updatedCount} employee(s). Employees with an existing position were skipped."
            : "No employees needed a position assignment.";

        return back()->with('success', $message);
    }

    public function bulkAssignBranchSite(BulkAssignBranchSiteRequest $request)
    {
        Gate::authorize('bulkAssign', Employee::class);

        if ($this->limit('bulk-assign-branch:' . auth()->id(), 60, 10)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        $data = [
            'branch_id' => $request->branch_id,
            'site_id' => $request->site_id, // can be null
        ];

        $updatedCount = Employee::whereIn('id', $request->ids)
            ->where(function ($query) {
                $query->whereNull('branch_id')
                    ->orWhereNull('site_id');
            })
            ->update($data);


        $this->cacheForget('employees');

        $message = $updatedCount > 0
            ? "Branch and site assigned to {$updatedCount} employee(s). Employees already having both were skipped."
            : "No employees needed branch/site assignment.";

        return back()->with('success', $message);
    }
}

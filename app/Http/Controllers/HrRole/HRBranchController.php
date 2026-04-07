<?php

namespace App\Http\Controllers\HrRole;

use App\Actions\Branch\CreateNewBranch;
use App\Actions\Branch\UpdateBranch;
use App\Http\Controllers\Controller;
use App\Http\Requests\Branch\StoreBranchRequest;
use App\Http\Requests\Branch\UpdateBranchRequest;
use App\Models\Branch;
use App\Repository\BranchRepository;
use App\Traits\HasPaginatedIndex;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class HRBranchController extends Controller
{
    use HasPaginatedIndex;

    public function __construct(private BranchRepository $branchRepository) {}
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $branches = $this->cacheRemember('branches', 60, function () {
            return $this->branchRepository->getBranches();
        });

        // $branches = Branch::withCount('sites')->get();

        $result = $this->paginateCollection(
            items: collect($branches), // wrap in Collection if not already
            request: $request,
            searchColumns: ['branch_name', 'branch_address'], // adjust to Branch columns
        );

        return Inertia::render('HR/Branch/index', [
            'branches'      => [
                'data' => $result['data'],
                'links' => $result['pagination']['links'] ?? [],
                'from' => $result['pagination']['from'] ?? 0,
                'to' => $result['pagination']['to'] ?? 0,
                'total' => $result['totalCount'],
            ],
            'filters'       => $result['filters'],
            'totalCount'    => $result['totalCount'],
            'filteredCount' => $result['filteredCount'],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', Branch::class);

        return Inertia::render('HR/Branch/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBranchRequest $request, CreateNewBranch $action)
    {
        Gate::authorize('create', Branch::class);

        if ($this->limit('create-branch:' . auth()->id(), 60, 15)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        try {
            DB::beginTransaction();

            $action->create($request->validated());

            $this->cacheForget('branches');

            DB::commit();

            return to_route('hr.branches.index')->with('success', 'Branch and site created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to create branch or site. Please try again.' . $e->getMessage());
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
    public function edit(Branch $branch)
    {
        Gate::authorize('update', $branch);

        $branch->load(['sites' => fn($query) => $query->getSiteName()]);
        return Inertia::render('HR/Branch/edit', compact('branch'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBranchRequest $request, Branch $branch, UpdateBranch $action)
    {
        Gate::authorize('update', $branch);

        if ($this->limit('update-branch:' . auth()->id(), 60, 15)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        try {
            DB::beginTransaction();

            // Get all site IDs from the request that have IDs (existing sites)
            $keepSiteIds = collect($request->sites)
                ->filter(fn($site) => isset($site['id']))
                ->pluck('id')
                ->toArray();

            // Delete sites that are not in the request
            $branch->sites()->whereNotIn('id', $keepSiteIds)->delete();

            // Update or create sites
            $action->update($request->validated(), $branch);

            $this->cacheForget('branches');

            DB::commit();

            return to_route('hr.branches.index')->with('success', 'Branch and sites updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to update branch or site. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Branch $branch)
    {
        Gate::authorize('delete', $branch);

        if ($this->limit('delete-branch:' . Auth::id(), 60, 10)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        $branch->delete();

        $this->cacheForget('branches');

        return to_route('hr.branches.index')->with('success', 'Branch and site deleted successfully.');
    }
}

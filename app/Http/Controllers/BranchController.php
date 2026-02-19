<?php

namespace App\Http\Controllers;

use App\Actions\Branch\UpdateBranch;
use App\Actions\Branch\CreateNewBranch;
use App\Http\Requests\Branch\StoreBranchRequest;
use App\Http\Requests\Branch\UpdateBranchRequest;
use App\Models\Branch;
use App\Repository\BranchRepository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
// use Inertia\Response;

class BranchController extends Controller
{
    public function __construct(private BranchRepository $branchRepository) {}
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $branches = $this->cacheRemember('branches', 60, function () {
            return $this->branchRepository->getBranches();
        });

        return Inertia::render('Branch/index', compact('branches'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Branch/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBranchRequest $request, CreateNewBranch $action)
    {
        try {
            DB::beginTransaction();

            $action->create($request->validated());

            Cache::forget('branches');

            DB::commit();

            return to_route('branches.index')->with('success', 'Branch or Site created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to create branch or site. Please try again.' . $e->getMessage());
        }
    }


    /**
     * Display the specified resource.
     */
    public function show(Branch $branch)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Branch $branch)
    {
        $branch->load(['sites'=>fn($query) => $query->getSiteName()]);
        return Inertia::render('Branch/edit', compact('branch'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBranchRequest $request, Branch $branch, UpdateBranch $action)
    {
        try {
            DB::beginTransaction();

            $action->update($request->validated(), $branch);

            Cache::forget('branches');

            DB::commit();

            return to_route('branches.index')->with('success', 'Branch or Site updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to update branch or site. Please try again.' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Branch $branch)
    {
        $branch->delete();

        Cache::forget('branches');

        return to_route('branches.index')->with('success', 'Branch or Site deleted successfully.');
    }
}

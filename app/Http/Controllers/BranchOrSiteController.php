<?php

namespace App\Http\Controllers;

use App\Actions\BranchOrSite\CreateNewBranchOrSite;
use App\Actions\BranchOrSite\UpdateBranchOrSite;
use App\Http\Requests\BranchOrSite\StoreBranchOrSiteRequest;
use App\Http\Requests\BranchOrSite\UpdateBranchOrSiteRequest;
use App\Models\BranchOrSite;
<<<<<<< HEAD
=======
use Illuminate\Support\Facades\Cache;
>>>>>>> 7ea0aeb994732ea4a80c27d57a2f189673bbda94
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BranchOrSiteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $branches = Cache::rememberForever('branches', function () {
            return BranchOrSite::get(['id', 'branch_name', 'branch_address']);
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
    public function store(StoreBranchOrSiteRequest $request, CreateNewBranchOrSite $action)
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
    public function show(BranchOrSite $branchOrSite)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(BranchOrSite $branch)
    {
        return Inertia::render('Branch/edit',compact('branch'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBranchOrSiteRequest $request, BranchOrSite $branch, UpdateBranchOrSite $action)
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
    public function destroy(BranchOrSite $branch)
    {
        $branch->delete();

        Cache::forget('branches');

        return to_route('branches.index')->with('success', 'Branch or Site deleted successfully.');
    }
}

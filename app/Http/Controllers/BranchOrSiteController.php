<?php

namespace App\Http\Controllers;

use App\Actions\BranchOrSite\CreateNewBranchOrSite;
use App\Actions\BranchOrSite\UpdateBranchOrSite;
use App\Http\Requests\BranchOrSite\StoreBranchOrSiteRequest;
use App\Http\Requests\BranchOrSite\UpdateBranchOrSiteRequest;
use App\Models\BranchOrSite;
use Illuminate\Support\Facades\DB;

class BranchOrSiteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBranchOrSiteRequest $request, CreateNewBranchOrSite $action)
    {
        try {
            DB::beginTransaction();
            
             $action->create($request->validated());
            
            DB::commit();
            
            return back()->with('success', 'Branch or Site created successfully.');
            
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
    public function edit(BranchOrSite $branchOrSite)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBranchOrSiteRequest $request, BranchOrSite $branchOrSite, UpdateBranchOrSite $action)
    {
         try {
            DB::beginTransaction();
            
             $action->update($request->validated(), $branchOrSite);
            
            DB::commit();
            
            return back()->with('success', 'Branch or Site updated successfully.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return back()
                ->with('error', 'Failed to update branch or site. Please try again.' . $e->getMessage());
        }

       
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BranchOrSite $branchOrSite)
    {
        $branchOrSite->delete();

        return back()->with('success', 'Branch or Site deleted successfully.');
    }
}

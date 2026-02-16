<?php

namespace App\Http\Controllers;

use App\Actions\Deduction\CreateNewDeduction;
use App\Actions\Deduction\UpdateDeduction;
use App\Http\Requests\Deduction\StoreDeductionRequest;
use App\Http\Requests\Deduction\UpdateDeductionRequest;
use App\Models\Deduction;
use Illuminate\Support\Facades\DB;


class DeductionController extends Controller
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
    public function store(StoreDeductionRequest $request, CreateNewDeduction $action)
    {
        try {
            DB::beginTransaction();

            $action->create($request->validated());

            DB::commit();

            return back()->with('success', 'Deduction created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to create Deduction. Please try again.' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Deduction $deduction)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Deduction $deduction)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateDeductionRequest $request, Deduction $deduction, UpdateDeduction $action)
    {
        try {
            DB::beginTransaction();

            $action->update($request->validated(), $deduction);

            DB::commit();

            return back()->with('success', 'Deduction updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to update Deduction. Please try again.' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Deduction $deduction)
    {
        $deduction->delete();

        return back()->with('success', 'Deduction deleted successfully.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Actions\ApplicationLeave\CreateNewApplication;
use App\Actions\ApplicationLeave\UpdateApplication;
use App\Http\Requests\ApplicationLeave\StoreApplicationLeaveRequest;
use App\Http\Requests\ApplicationLeave\UpdateApplicationLeaveRequest;
use App\Models\ApplicationLeave;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ApplicationLeaveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $applicationLeaves = ApplicationLeave::with(['employee.user'])->latest()->get();

        return inertia('ApplicationLeave/index', [
            'applicationLeaves' => $applicationLeaves,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('ApplicationLeave/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreApplicationLeaveRequest $request, CreateNewApplication $createNewApplication)
    {
        if ($this->limit('create-application-leave:' . auth()->id(), 60, 20)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
           DB::beginTransaction();
        try {
            $validatedData = $request->validated();

            $createNewApplication->createNewApplicationLeave($validatedData);

            DB::commit();

            return redirect()->route('application-leave.index')->with('success', 'Leave application submitted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'An error occurred while submitting the leave application. Please try again.');
         
        }
    }


    /**
     * Display the specified resource.
     */
    public function show(ApplicationLeave $applicationLeave)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ApplicationLeave $applicationLeave)
    {
        return Inertia::render('ApplicationLeave/edit', [
            'applicationLeave' => $applicationLeave,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateApplicationLeaveRequest $request, ApplicationLeave $applicationLeave, UpdateApplication $updateApplication)
    {
        if ($this->limit('update-application-leave:' . auth()->id(), 60, 20)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        DB::beginTransaction();
        try {
            $validatedData = $request->validated();

            $updateApplication->updateApplicationLeave($validatedData, $applicationLeave);

            DB::commit();

            return redirect()->route('application-leave.index')->with('success', 'Leave application updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'An error occurred while updating the leave application. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ApplicationLeave $applicationLeave)
    {
        if ($this->limit('delete-application-leave:' . auth()->id(), 60, 20)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        $applicationLeave->delete();
        return redirect()->route('application-leave.index')->with('success', 'Leave application deleted successfully.');
    }
}

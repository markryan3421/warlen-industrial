<?php

namespace App\Http\Controllers;

use App\Actions\ApplicationLeave\CreateNewApplication;
use App\Actions\ApplicationLeave\UpdateApplication;
use App\Http\Requests\ApplicationLeave\StoreApplicationLeaveRequest;
use App\Http\Requests\ApplicationLeave\UpdateApplicationLeaveRequest;
use App\Models\ApplicationLeave;
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
        $createNewApplication->createNewApplicationLeave($request->validated());

        return redirect()->route('application-leave.index')->with('success', 'Leave application submitted successfully.');
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
        $updateApplication->updateApplicationLeave($request->validated(), $applicationLeave);

        return redirect()->route('application-leave.index')->with('success', 'Leave application updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ApplicationLeave $applicationLeave)
    {
        $applicationLeave->delete();
        return redirect()->route('application-leave.index')->with('success', 'Leave application deleted successfully.');
    }
}

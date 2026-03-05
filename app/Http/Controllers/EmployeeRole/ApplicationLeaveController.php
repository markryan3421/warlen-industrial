<?php

namespace App\Http\Controllers\EmployeeRole;

use App\Actions\ApplicationLeave\CreateNewApplication;
use App\Http\Controllers\Controller;
use App\Http\Requests\ApplicationLeave\StoreApplicationLeaveRequest;
use App\Models\ApplicationLeave;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rules\In;
use Inertia\Inertia;

class ApplicationLeaveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(CreateNewApplication $action)
    {
        Gate::authorize('viewAny',ApplicationLeave::class);

        $applicationLeaves = ApplicationLeave::whereHas('employee', function ($query) {
            $query->where('user_id', auth()->id());
        })->latest()->get();

        $approvedCount = $action->approvedLimit();

        return Inertia::render('employee-role/ApplicationLeave/index', compact('applicationLeaves', 'approvedCount'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', ApplicationLeave::class);
        return  Inertia::render('employee-role/ApplicationLeave/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreApplicationLeaveRequest $request, CreateNewApplication $action)
    {
        Gate::authorize('create', ApplicationLeave::class);
        if ($this->limit('create-application-leave:' . auth()->id(), 60, 20)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        DB::beginTransaction();
        try {
            $validatedData = $request->validated();

            // Check if user has reached the limit of 5 approved leaves for the current year
            $approvedLeavesCount = $action->approvedLimit();

            if ($approvedLeavesCount >= 5) {
                DB::rollBack();
                return back()->with('error', 'You have reached the maximum limit of 5 approved leaves for this year.');
            }

            $action->createNewApplicationLeave($validatedData);

            DB::commit();

            return redirect()->route('employee.application-leave.index')->with('success', 'Leave application submitted successfully.');
        } catch (\Exception $e) {
            dd($e);
            DB::rollBack();
            return back()->with('error', 'An error occurred while submitting the leave application. Please try again.');
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
    public function edit(ApplicationLeave $applicationLeave)
    {
        Gate::authorize('update', $applicationLeave);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ApplicationLeave $applicationLeave)
    {
        Gate::authorize('update', $applicationLeave);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ApplicationLeave $applicationLeave)
    {
        Gate::authorize('delete', $applicationLeave);
    }
}

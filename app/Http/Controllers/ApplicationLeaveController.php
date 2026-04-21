<?php

namespace App\Http\Controllers;

use App\Actions\ApplicationLeave\CreateNewApplication;
use App\Actions\ApplicationLeave\UpdateApplication;
use App\Enums\ApplicationLeaveEnum;
use App\Events\ApplicationLeaveEvent;
use App\Events\ApplicationLeaveUpdated;
use App\Http\Requests\ApplicationLeave\StoreApplicationLeaveRequest;
use App\Http\Requests\ApplicationLeave\UpdateApplicationLeaveRequest;
use App\Models\ApplicationLeave;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ApplicationLeaveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', ApplicationLeave::class);

        // Get pagination parameters
        $perPage = (int) $request->input('perPage', 10);
        $currentPage = (int) $request->input('page', 1);
        $search = $request->input('search', '');
        $statusFilter = $request->input('status', '');

        // Build query
        $query = ApplicationLeave::with(['employee.user'])->latest();

        // Apply search filter
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('employee.user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%");
                })->orWhereHas('employee', function ($empQuery) use ($search) {
                    $empQuery->where('emp_code', 'like', "%{$search}%");
                });
            });
        }

        // Apply status filter
        if (!empty($statusFilter) && $statusFilter !== 'all') {
            $query->where('app_status', $statusFilter);
        }

        // Get total count for pagination
        $totalCount = $query->count();

        // Get paginated results
        $applicationLeaves = $query->paginate($perPage, ['*'], 'page', $currentPage);

        $applicationLeaveEnum = ApplicationLeaveEnum::options();

        return inertia('ApplicationLeave/index', [
            'applicationLeaves' => [
                'data' => $applicationLeaves->items(),
                'links' => $applicationLeaves->linkCollection()->toArray(),
                'from' => $applicationLeaves->firstItem(),
                'to' => $applicationLeaves->lastItem(),
                'total' => $applicationLeaves->total(),
                'current_page' => $applicationLeaves->currentPage(),
                'last_page' => $applicationLeaves->lastPage(),
                'per_page' => $applicationLeaves->perPage(),
            ],
            'applicationLeaveEnum' => $applicationLeaveEnum,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'perPage' => (string) $perPage,
            ],
            'totalCount' => $totalCount,
            'filteredCount' => $applicationLeaves->total(),
        ]);
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', ApplicationLeave::class);
        return Inertia::render('ApplicationLeave/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreApplicationLeaveRequest $request, CreateNewApplication $createNewApplication)
    {
        Gate::authorize('create', ApplicationLeave::class);
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
            // dd($e);
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
        Gate::authorize('update', $applicationLeave);

        $applicationLeave->load('employee.user');

        $applicationLeaveEnum = ApplicationLeaveEnum::options();
        return Inertia::render('ApplicationLeave/edit', [
            'applicationLeave' => $applicationLeave,
            'applicationLeaveEnum' => $applicationLeaveEnum
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateApplicationLeaveRequest $request, ApplicationLeave $applicationLeave, UpdateApplication $updateApplication)
    {
        Gate::authorize('update', $applicationLeave);

        if ($this->limit('update-application-leave:' . auth()->id(), 60, 20)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        DB::beginTransaction();
        try {
            $validatedData = $request->validated();

            $applicationLeave = $updateApplication->updateApplicationLeave($validatedData, $applicationLeave);
            DB::commit();
            // broadcast(new ApplicationLeaveEvent($applicationLeave));


            return redirect()->route('application-leave.index')->with('success', 'Leave application updated successfully.');
        } catch (\Exception $e) {
            // dd($e);
            DB::rollBack();
            return back()->with('error', 'An error occurred while updating the leave application. Please try again.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ApplicationLeave $applicationLeave)
    {
        Gate::authorize('delete', $applicationLeave);

        if ($this->limit('delete-application-leave:' . auth()->id(), 60, 20)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        $applicationLeave->delete();
        return redirect()->route('application-leave.index')->with('success', 'Leave application deleted successfully.');
    }
}

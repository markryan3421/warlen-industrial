<?php

namespace App\Http\Controllers;

use App\Actions\Incentive\CreateNewIncentive;
use App\Actions\Incentive\UpdateIncentive;
use App\Enums\PayrollPeriodStatusEnum;
use App\Http\Requests\Incentive\StoreIncentiveRequest;
use App\Http\Requests\Incentive\UpdateIncentiveRequest;
use App\Models\Employee;
use App\Models\Incentive;
use App\Models\PayrollPeriod;
use App\Repository\IncentiveRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class IncentiveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function __construct(private IncentiveRepository $incentiveRepository) {}
    public function index()
    {
        Gate::authorize('viewAny', Incentive::class);

        // Get filter parameters from request
        $search = $request->input('search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $perPage = $request->input('per_page', 10);

        // Debug: Check payroll periods
        Log::info('=== PAYROLL PERIOD DEBUG ===');
        
        // Build the incentives query with filters
        $incentivesQuery = Incentive::query()
            ->with([
                'payroll_period',
                'employees',
                'employees.user',
                'employees.position',
                'employees.branch'
            ])
            ->orderBy('created_at', 'desc');

        // Apply search filter
        if ($search) {
            $incentivesQuery->where('incentive_name', 'like', '%' . $search . '%');
        }

          $payroll_periods = $this->cacheRemember('payroll_periods', 60, function () {
            return PayrollPeriod::query()
                ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
                ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
        });

        // $employees = $this->cacheRemember('employees', 60, function () {
        //     return Employee::with('user')
        //         ->where('employee_status', 'active')
        //         ->get(['id', 'user_id', 'employee_status']);
        // });
    $employees = $this->incentiveRepository->getEmployees();


        Log::info('Employees count: ' . $employees->count());
            
        return Inertia::render('incentives/index', [
            'incentives' => $incentives,
            'payroll_periods' => $payroll_periods,
            'employees' => $employees,
            'editingIncentive' => null,
            'isEditing' => false,
            'filters' => [
                'search' => $search,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'page' => $incentives->currentPage(),
                'per_page' => $perPage,
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreIncentiveRequest $request, CreateNewIncentive $incentive)
    {
        Gate::authorize('create', Incentive::class);
        DB::beginTransaction();
        try {
            $incentive->create($request->validated());
            DB::commit();
            return redirect()->route('incentives.index')->with('success', 'Incentive created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('incentives.index')->with('error', 'Failed to create incentive: ' . $e->getMessage());
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, Incentive $incentive)
    {
        Gate::authorize('update', $incentive);
        $incentive->load('payroll_period', 'employees');
        
        // Get filter parameters to preserve state
        $search = $request->input('search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $perPage = $request->input('per_page', 10);
        
        // Build query with same filters for background data
        $incentivesQuery = Incentive::query()
            ->with([
                'payroll_period',
                'employees',
                'employees.user',
                'employees.position',
                'employees.branch'
            ])
            ->orderBy('created_at', 'desc');

        if ($search) {
            $incentivesQuery->where('incentive_name', 'like', '%' . $search . '%');
        }

        if ($dateFrom) {
            $incentivesQuery->whereHas('payroll_period', function($query) use ($dateFrom) {
                $query->whereDate('start_date', '>=', $dateFrom);
            });
        }

        if ($dateTo) {
            $incentivesQuery->whereHas('payroll_period', function($query) use ($dateTo) {
                $query->whereDate('end_date', '<=', $dateTo);
            });
        }

        $incentives = $incentivesQuery->paginate($perPage);
        
        // Append query parameters
        if ($search) $incentives->appends('search', $search);
        if ($dateFrom) $incentives->appends('date_from', $dateFrom);
        if ($dateTo) $incentives->appends('date_to', $dateTo);
        $incentives->appends('per_page', $perPage);
        
        // Get payroll periods (same logic as index)
        $payroll_periods = PayrollPeriod::query()
            ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
            ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
        
        // Fallback if no open periods
        if ($payroll_periods->count() === 0) {
            $payroll_periods = PayrollPeriod::query()
                ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
        }
        
        $employees = Employee::with('user')
            ->get(['id', 'emp_code', 'user_id'])
            ->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'emp_code' => $employee->emp_code,
                    'user' => $employee->user ? [
                        'name' => $employee->user->name
                    ] : null,
                ];
            });

        return Inertia::render('incentives/index', [
            'incentives' => $incentives,
            'editingIncentive' => $incentive,
            'employees' => $employees,
            'payroll_periods' => $payroll_periods,
            'isEditing' => true,
            'filters' => [
                'search' => $search,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'page' => $incentives->currentPage(),
                'per_page' => $perPage,
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateIncentiveRequest $request, Incentive $incentive, UpdateIncentive $updateincentive)
    {
        Gate::authorize('update', $incentive);
        DB::beginTransaction();
        try {
            $updateincentive->update($request->validated(), $incentive);
            DB::commit();
            return redirect()->route('incentives.index')->with('success', 'Incentive updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('incentives.index')->with('error', 'Failed to update incentive: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Incentive $incentive)
    {
        Gate::authorize('delete', $incentive);
        
        DB::beginTransaction();
        try {
            $incentive->delete();
            DB::commit();
            return redirect()->route('incentives.index')->with('success', 'Incentive deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('incentives.index')->with('error', 'Failed to delete incentive: ' . $e->getMessage());
        }
    }
}
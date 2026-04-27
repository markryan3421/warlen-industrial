<?php

namespace App\Http\Controllers\HrRole;

use App\Actions\Deduction\CreateNewDeduction;
use App\Actions\Deduction\UpdateDeduction;
use App\Enums\PayrollPeriodStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Deduction\StoreDeductionRequest;
use App\Models\Deduction;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Repository\IncentiveRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class HRDeductionController extends Controller
{
    public function __construct(protected IncentiveRepository $deductionRepository) {}
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Deduction::class);

        $search = $request->input('search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $perPage = $request->input('per_page', 10);

        $deductionsQuery = Deduction::query()
            ->with([
                'payroll_period',
                'employees',
                'employees.user',
                'employees.position',
                'employees.branch'
            ])
            ->orderBy('created_at', 'desc');

        if ($search) {
            $deductionsQuery->where('deduction_name', 'like', '%' . $search . '%');
        }

        if ($dateFrom) {
            $deductionsQuery->whereHas('payroll_period', function ($query) use ($dateFrom) {
                $query->whereDate('start_date', '>=', $dateFrom);
            });
        }

        if ($dateTo) {
            $deductionsQuery->whereHas('payroll_period', function ($query) use ($dateTo) {
                $query->whereDate('end_date', '<=', $dateTo);
            });
        }

        $deductions = $deductionsQuery->paginate($perPage);

        if ($search) $deductions->appends('search', $search);
        if ($dateFrom) $deductions->appends('date_from', $dateFrom);
        if ($dateTo) $deductions->appends('date_to', $dateTo);
        $deductions->appends('per_page', $perPage);

        $payroll_periods = PayrollPeriod::query()
            ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
            ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);

        if ($payroll_periods->count() === 0) {
            $payroll_periods = PayrollPeriod::query()
                ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
        }

        $employees = Employee::with('user')
            ->where('employee_status', 'active')
            ->get(['id', 'emp_code', 'user_id'])
            ->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'emp_code' => $employee->emp_code,
                    'user' => $employee->user ? ['name' => $employee->user->name] : null,
                ];
            });

        return Inertia::render('HR/deductions/index', [
            'deductions' => $deductions,
            'payroll_periods' => $payroll_periods,
            'employees' => $employees,
            'editingDeduction' => null,
            'isEditing' => false,
            'filters' => [
                'search' => $search,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'page' => $deductions->currentPage(),
                'per_page' => $perPage,
            ]
        ]);
    }
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        Gate::authorize('create', Deduction::class);

        $payroll_periods = $this->deductionRepository->getOpenPayrollPeriods();

        $employees = $this->deductionRepository->getEmployees();

        return Inertia::render('HR/deductions/create', compact('payroll_periods', 'employees'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CreateNewDeduction $action, StoreDeductionRequest $request)
    {
        Gate::authorize('create', Deduction::class);

        if ($this->limit('create-deduction:' . auth()->id(), 60, 15)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }

        try {
            DB::beginTransaction();

            $action->create($request->validated());

            DB::commit();

            return to_route('hr.deductions.index')->with('success', 'Deduction created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to create deduction. Please try again.' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id) {}

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Deduction $deduction)
    {
        Gate::authorize('update', $deduction);

        $deduction->load('payroll_period', 'employees');

        $employees = $this->deductionRepository->getEmployees();

        $payroll_periods = $this->deductionRepository->getOpenPayrollPeriods();

        return Inertia::render('HR/deductions/edit', [
            'deduction' => $deduction,
            'employees' => $employees,
            'payroll_periods' => $payroll_periods
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateDeduction $action, StoreDeductionRequest $request, Deduction $deduction)
    {
        Gate::authorize('update', $deduction);

        if ($this->limit('update-deduction:' . auth()->id(), 60, 15)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        try {
            DB::beginTransaction();

            $action->update($request->validated(), $deduction);

            DB::commit();

            return to_route('hr.deductions.index')->with('success', ' Deduction updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to update deduction. Please try again.' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Deduction $deduction)
    {
        Gate::authorize('delete', $deduction);
        if ($this->limit('delete-deduction:' . auth()->id(), 60, 15)) {
            return back()->with('error', 'Too many attempts. Please try again later.');
        }
        try {
            DB::beginTransaction();

            $deduction->delete();

            DB::commit();

            return to_route('hr.deductions.index')->with('warning', ' Deduction deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to delete deduction. Please try again.' . $e->getMessage());
        }
    }
}

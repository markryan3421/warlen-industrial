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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class IncentiveController extends Controller
{
	/**
	 * Display a listing of the resource.
	 */
	public function index(Request $request)
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

		// Apply date filters through payroll period relationship
		if ($dateFrom) {
			$incentivesQuery->whereHas('payroll_period', function ($query) use ($dateFrom) {
				$query->whereDate('start_date', '>=', $dateFrom);
			});
		}

		if ($dateTo) {
			$incentivesQuery->whereHas('payroll_period', function ($query) use ($dateTo) {
				$query->whereDate('end_date', '<=', $dateTo);
			});
		}

		// PAGINATE instead of get()
		$incentives = $incentivesQuery->paginate($perPage);

		// Append query parameters to pagination links
		if ($search) {
			$incentives->appends('search', $search);
		}
		if ($dateFrom) {
			$incentives->appends('date_from', $dateFrom);
		}
		if ($dateTo) {
			$incentives->appends('date_to', $dateTo);
		}
		$incentives->appends('per_page', $perPage);

		Log::info('Incentives pagination:', [
			'total' => $incentives->total(),
			'current_page' => $incentives->currentPage(),
			'per_page' => $incentives->perPage(),
			'from' => $incentives->firstItem(),
			'to' => $incentives->lastItem()
		]);

		// Get OPEN payroll periods
		$payroll_periods = PayrollPeriod::query()
			->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
			->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);

		Log::info('Open payroll periods count: ' . $payroll_periods->count());

		// If no open periods, try to get all periods (for testing)
		if ($payroll_periods->count() === 0) {
			Log::warning('No OPEN payroll periods found. Getting all periods for testing.');
			$payroll_periods = PayrollPeriod::query()
				->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
			Log::info('All payroll periods count (fallback): ' . $payroll_periods->count());
		}

		// Get employees
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

	public function create()
	{
		// Get OPEN payroll periods
		$payroll_periods = PayrollPeriod::query()
			->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
			->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);

		Log::info('Open payroll periods count: ' . $payroll_periods->count());

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

		// If no open periods, try to get all periods (for testing)
		if ($payroll_periods->count() === 0) {
			Log::warning('No OPEN payroll periods found. Getting all periods for testing.');
			$payroll_periods = PayrollPeriod::query()
				->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
			Log::info('All payroll periods count (fallback): ' . $payroll_periods->count());
		}

		return Inertia::render('incentives/create', [
			'payroll_periods' => $payroll_periods,
			'employees' => $employees,
		]);
	}

	/**
	 * Store a newly created resource in storage.
	 */
	public function store(StoreIncentiveRequest $request, CreateNewIncentive $incentive)
	{
		Log::info('Store method called', $request->validated());

		Gate::authorize('create', Incentive::class);
		DB::beginTransaction();
		try {
			$result = $incentive->create($request->validated());
			Log::info('Result of create: ', ['id' => $result->id ?? null]);
			DB::commit();
			return redirect()->route('incentives.index')->with('success', 'Incentive created successfully.');
		} catch (\Exception $e) {
			DB::rollBack();
			Log::error('Store exception: ' . $e->getMessage());
			return redirect()->route('incentives.index')->with('error', 'Failed to create incentive: ' . $e->getMessage());
		}
	}

	/**
	 * Show the form for editing the specified resource.
	 */
	public function edit(Incentive $incentive)
	{
		// Load the incentive with its employees relationship
		$incentive->load('employees');

		// Get OPEN payroll periods
		$payroll_periods = PayrollPeriod::query()
			->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
			->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);

		Log::info('Open payroll periods count: ' . $payroll_periods->count());

		// Get all employees with user relationship for selection
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

		// If no open periods, try to get all periods (for testing)
		if ($payroll_periods->count() === 0) {
			Log::warning('No OPEN payroll periods found. Getting all periods for testing.');
			$payroll_periods = PayrollPeriod::query()
				->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
			Log::info('All payroll periods count (fallback): ' . $payroll_periods->count());
		}

		Log::info('Employees count: ' . $employees->count());

		return Inertia::render('incentives/edit', [
			'incentive' => [
				'id' => $incentive->id,
				'incentive_name' => $incentive->incentive_name,
				'incentive_amount' => $incentive->incentive_amount,
				'payroll_period_id' => $incentive->payroll_period_id,
				'is_daily' => $incentive->is_daily,
				'employees' => $incentive->employees->map(function ($employee) {
					return [
						'id' => $employee->id,
						'name' => $employee->user?->name ?? 'Unknown',
					];
				}),
			],
			'payroll_periods' => $payroll_periods,
			'employees' => $employees,
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

		$incentive->delete();

		return redirect()->route('incentives.index')->with('warning', 'Incentive deleted successfully.');
	}
}

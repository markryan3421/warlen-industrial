<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use App\Services\PayrollService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Traits\HasPaginatedIndex;
use Inertia\Inertia;

class PayrollController extends Controller
{

    use HasPaginatedIndex;
    public function __construct(protected PayrollService $payrollService) {}
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Payroll::class);

        // Build query with relationships
        $query = Payroll::query()
            ->with(['payrollPeriod', 'employee.user', 'employee.position', 'payrollItems'])
            ->latest();

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('employee.user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })->orWhereHas('employee', function ($q) use ($search) {
                    $q->where('emp_code', 'like', "%{$search}%");
                });
            });
        }

        // Apply position filter
        if ($request->filled('positions')) {
            $positions = explode(',', $request->positions);
            $query->whereHas('employee.position', function ($q) use ($positions) {
                $q->whereIn('pos_name', $positions);
            });
        }

        if ($request->filled('date_from') || $request->filled('date_to')) {
            $query->whereHas('payrollPeriod', function ($q) use ($request) {
                if ($request->filled('date_from') && $request->filled('date_to')) {
                    // Full range: period must overlap the selected range
                    $q->whereDate('start_date', '<=', $request->date_to)
                        ->whereDate('end_date', '>=', $request->date_from);
                } elseif ($request->filled('date_from')) {
                    // Only from date: period must contain this exact date
                    // (started on or before it AND ends on or after it)
                    $q->whereDate('start_date', '<=', $request->date_from)
                        ->whereDate('end_date', '>=', $request->date_from);
                } elseif ($request->filled('date_to')) {
                    // Only to date: period must contain this exact date
                    $q->whereDate('start_date', '<=', $request->date_to)
                        ->whereDate('end_date', '>=', $request->date_to);
                }
            });
        }

        // Get total count before pagination
        $totalCount = $query->count();

        // Apply pagination
        $perPage = $request->input('perPage', 10);
        $payrolls = $query->paginate($perPage);

        // Get filtered count
        $filteredCount = $payrolls->total();

        // Get all unique positions for filter dropdown
        $allPositions = Payroll::query()
            ->with('employee.position')
            ->get()
            ->pluck('employee.position.pos_name')
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->toArray();

        // Calculate totals for the filtered payrolls
        $payrollsCollection = $payrolls->getCollection();

        return Inertia::render('payrolls/index', [
            'payrolls' => $payrolls->items(),
            'pagination' => [
                'current_page' => $payrolls->currentPage(),
                'last_page' => $payrolls->lastPage(),
                'per_page' => $payrolls->perPage(),
                'total' => $payrolls->total(),
                'from' => $payrolls->firstItem(),
                'to' => $payrolls->lastItem(),
                'links' => $payrolls->linkCollection()->toArray(),
            ],
            'filters' => [
                'search' => $request->search,
                'positions' => $request->positions,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'perPage' => $request->perPage,
            ],
            'totalCount' => $totalCount,
            'filteredCount' => $filteredCount,
            'totalOvertimePay' => $this->payrollService->calculateTotalOvertimePay($payrollsCollection),
            'totalOvertimeHours' => $this->payrollService->calculateTotalOvertimeHours($payrollsCollection),
            'totalDeductions' => $this->payrollService->calculateTotalDeductions($payrollsCollection),
            'totalNetPay' => $this->payrollService->calculateTotalNetPay($payrollsCollection),
            'totalGrossPay' => $this->payrollService->calculateTotalGrossPay($payrollsCollection),
            'activeEmployee' => $this->payrollService->getActiveEmployeesInPayroll($payrollsCollection),
            'allPositions' => $allPositions,
            'branchesData' => [],
        ]);
    }

   public function getPrintData($id)
{
    $payroll = Payroll::with(['employee.user', 'employee.position', 'payrollPeriod', 'payrollItems'])
        ->findOrFail($id);

    return response()->json([
        'id' => $payroll->id,
        'employee_name' => $payroll->employee->user->name,
        'employee_code' => $payroll->employee->emp_code,
        'position' => $payroll->employee->position->pos_name ?? 'N/A',
        'payroll_period' => $payroll->payrollPeriod->period_name ?? 'N/A',
        'start_date' => $payroll->payrollPeriod->start_date ?? '',
        'end_date' => $payroll->payrollPeriod->end_date ?? '',
        'pay_date' => $payroll->payrollPeriod->pay_date ?? '',
        'gross_pay' => $payroll->gross_pay,
        'total_deduction' => $payroll->total_deduction,
        'net_pay' => $payroll->net_pay,
        'avatar' => $payroll->employee->avatar,
        'earnings' => $payroll->payrollItems->where('type', 'earning')->values()->map(fn($item) => [
            'description' => $item->description ?? $item->code ?? 'Earning',
            'amount' => $item->amount,
        ]),
        'deductions' => $payroll->payrollItems->where('type', 'deduction')->values()->map(fn($item) => [
            'description' => $item->description ?? $item->code ?? 'Deduction',
            'amount' => $item->amount,
        ]),
    ]);
} 

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Payroll $payroll)
    {
        // $payroll->load([
        //     'payrollPeriod',
        //     'employee.user',
        //     'employee.position',
        //     'payrollItems'
        // ]);

        return Inertia::render('Payroll/Show', [
            'payroll' => $payroll
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Payroll $payroll)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payroll $payroll)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payroll $payroll)
    {
        //
    }
}

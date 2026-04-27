<?php

namespace App\Http\Controllers\HrRole;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use App\Models\Branch;
use App\Models\Site;
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
            ->with([
                'payrollPeriod',
                'employee.user',
                'employee.position',
                'employee.branch',
                'employee.branch.sites',
                'employee.site',
                'payrollItems'
            ])
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

        // Position filter
        if ($request->filled('positions')) {
            $positions = explode(',', $request->positions);
            $lowerPositions = array_map('strtolower', $positions);
            $placeholders = implode(',', array_fill(0, count($lowerPositions), '?'));
            $query->whereHas('employee.position', function ($q) use ($lowerPositions, $placeholders) {
                $q->whereRaw("LOWER(pos_name) IN ($placeholders)", $lowerPositions);
            });
        }

        // Branch filter
        if ($request->filled('branches')) {
            $branches = explode(',', $request->branches);
            $lowerBranches = array_map('strtolower', $branches);
            $placeholders = implode(',', array_fill(0, count($lowerBranches), '?'));
            $query->whereHas('employee.branch', function ($q) use ($lowerBranches, $placeholders) {
                $q->whereRaw("LOWER(branch_name) IN ($placeholders)", $lowerBranches);
            });
        }

        // Site filter
        if ($request->filled('sites')) {
            $sites = explode(',', $request->sites);
            $lowerSites = array_map('strtolower', $sites);
            $placeholders = implode(',', array_fill(0, count($lowerSites), '?'));
            $query->whereHas('employee.site', function ($q) use ($lowerSites, $placeholders) {
                $q->whereRaw("LOWER(site_name) IN ($placeholders)", $lowerSites);
            });
        }

        // Apply date range filter
        if ($request->filled('date_from') || $request->filled('date_to')) {
            $query->whereHas('payrollPeriod', function ($q) use ($request) {
                if ($request->filled('date_from') && $request->filled('date_to')) {
                    $q->whereDate('start_date', '<=', $request->date_to)
                        ->whereDate('end_date', '>=', $request->date_from);
                } elseif ($request->filled('date_from')) {
                    $q->whereDate('start_date', '<=', $request->date_from)
                        ->whereDate('end_date', '>=', $request->date_from);
                } elseif ($request->filled('date_to')) {
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

        // Get all unique branches for filter dropdown as simple array
        $allBranches = Branch::query()
            ->orderBy('branch_name')
            ->pluck('branch_name')
            ->toArray();

        // If no branches in branches table, get from employees that have branches
        if (empty($allBranches)) {
            $allBranches = Payroll::query()
                ->with('employee.branch')
                ->get()
                ->pluck('employee.branch.branch_name')
                ->filter()
                ->unique()
                ->sort()
                ->values()
                ->toArray();
        }

        // Get all unique sites for filter dropdown
        $allSites = Site::query()
            ->orderBy('site_name')
            ->pluck('site_name')
            ->toArray();

        // If no sites in sites table, get from employees that have sites
        if (empty($allSites)) {
            $allSites = Payroll::query()
                ->with('employee.site')
                ->get()
                ->pluck('employee.site.site_name')
                ->filter()
                ->unique()
                ->sort()
                ->values()
                ->toArray();
        }

        // Get branches data for the filter bar (with sites)
        $branchesData = Branch::query()
            ->with('sites')
            ->select('id', 'branch_name', 'branch_address')
            ->orderBy('branch_name')
            ->get()
            ->map(function ($branch) {
                return [
                    'id' => $branch->id,
                    'branch_name' => $branch->branch_name,
                    'branch_address' => $branch->branch_address ?? '',
                    'sites' => $branch->sites->map(function ($site) {
                        return [
                            'id' => $site->id,
                            'site_name' => $site->site_name
                        ];
                    })->toArray()
                ];
            })
            ->toArray();

        // Calculate totals for the filtered payrolls
        $payrollsCollection = $payrolls->getCollection();

        return Inertia::render('HR/payroll/index', [
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
                'branches' => $request->branches,
                'sites' => $request->sites,
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
            'allBranches' => $allBranches,
            'allSites' => $allSites,
            'branchesData' => $branchesData,
        ]);
    }

    /**
     * Get print data for a specific payroll
     */
    public function getPrintData($id)
    {
        $payroll = Payroll::with(['employee.user', 'employee.position', 'employee.branch', 'employee.site', 'payrollPeriod', 'payrollItems'])
            ->findOrFail($id);

        Gate::authorize('viewAny', $payroll);

        return response()->json([
            'id' => $payroll->id,
            'employee_name' => $payroll->employee->user->name,
            'employee_code' => $payroll->employee->emp_code,
            'position' => $payroll->employee->position->pos_name ?? 'N/A',
            'branch_name' => $payroll->employee->branch->branch_name ?? 'N/A',
            'site_name' => $payroll->employee->site->site_name ?? 'N/A',
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
     * Display the specified resource.
     */
    public function show(Payroll $payroll)
    {
        $payroll->load([
            'payrollPeriod',
            'employee.user',
            'employee.position',
            'employee.branch',
            'employee.branch.sites',
            'employee.site',
            'payrollItems'
        ]);

        return Inertia::render('HR/payroll/show', [
            'payroll' => $payroll
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $payroll = Payroll::findOrFail($id);
        Gate::authorize('delete', $payroll);

        $payroll->delete();

        return redirect()->back()->with('success', 'Payroll record deleted successfully');
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
    public function store(Request $request)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        //
    }
}

<?php

namespace App\Http\Controllers\HrRole;

use App\Http\Controllers\Controller;
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

        // Get paginated filtered payrolls from service
        $paginatedResult = $this->payrollService->getPaginatedFilteredPayrolls($request);

        $payrolls = $paginatedResult['payrolls'];
        $filteredCount = $paginatedResult['filteredCount'];

        // Get filter dropdown data from service
        $allPositions = $this->payrollService->getAllPositions();
        $allBranches = $this->payrollService->getAllBranches();
        $allSites = $this->payrollService->getAllSites();
        $branchesData = $this->payrollService->getBranchesData();

        // Get payrolls collection for calculations
        $payrollsCollection = $payrolls->getCollection();

        // Calculate totals using service methods
        $calculations = [
            'totalOvertimePay' => $this->payrollService->calculateTotalOvertimePay($payrollsCollection),
            'totalOvertimeHours' => $this->payrollService->calculateTotalOvertimeHours($payrollsCollection),
            'totalDeductions' => $this->payrollService->calculateTotalDeductions($payrollsCollection),
            'totalNetPay' => $this->payrollService->calculateTotalNetPay($payrollsCollection),
            'totalGrossPay' => $this->payrollService->calculateTotalGrossPay($payrollsCollection),
            'activeEmployee' => $this->payrollService->getActiveEmployeesInPayroll($payrollsCollection),
        ];

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
            'totalCount' => $payrolls->total(),
            'filteredCount' => $filteredCount,
            'totalOvertimePay' => $calculations['totalOvertimePay'],
            'totalOvertimeHours' => $calculations['totalOvertimeHours'],
            'totalDeductions' => $calculations['totalDeductions'],
            'totalNetPay' => $calculations['totalNetPay'],
            'totalGrossPay' => $calculations['totalGrossPay'],
            'activeEmployee' => $calculations['activeEmployee'],
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

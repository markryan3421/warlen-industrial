<?php

namespace App\Http\Controllers;

use App\Models\Payroll;
use App\Services\PayrollService;
use App\Traits\HasPaginatedIndex;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use App\Mail\PayrollSummaryMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

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

       // dd($payrolls->perPage());

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
        $payroll->load([
            'payrollPeriod',
            'employee.user',
            'employee.position',
            'employee.branch',
            'employee.branch.sites',
            'employee.site',
            'payrollItems'
        ]);

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

public function emailPayroll(Payroll $payroll): JsonResponse
{
    try {
        // Force load all required relationships
        $payroll->loadMissing([
            'employee.user', 
            'payrollPeriod', 
            'payrollItems',
            'employee.position'
        ]);

        // TEMPORARILY COMMENT OUT AUTHORIZATION FOR TESTING
        // Gate::authorize('view', $payroll);

        $email = $payroll->employee?->user?->email;
        if (!$email) {
            Log::warning('No email address for payroll', ['payroll_id' => $payroll->id]);
            return response()->json(['message' => 'Employee has no email address.'], 422);
        }

        Mail::to($email)->send(new PayrollSummaryMail($payroll));

        Log::info('Payroll email sent', ['payroll_id' => $payroll->id, 'email' => $email]);
        return response()->json(['message' => 'Payroll summary sent successfully.']);

    } catch (\Exception $e) {
        Log::error('Email sending failed', [
            'payroll_id' => $payroll->id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'message' => 'Failed to send email: ' . $e->getMessage()
        ], 500);
    }
}
    public function bulkEmail(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return response()->json(['message' => 'No payroll IDs provided.'], 422);
        }

        $payrolls = Payroll::with(['employee.user', 'employee.position', 'payrollPeriod', 'payrollItems'])
            ->whereIn('id', $ids)
            ->get();

        $success = 0;
        $failures = 0;
        $errors = [];

        foreach ($payrolls as $payroll) {
            $email = $payroll->employee?->user?->email;
            if (!$email) {
                $failures++;
                $errors[] = "Payroll #{$payroll->id}: no email address";
                continue;
            }

            try {
                Mail::to($email)->send(new PayrollSummaryMail($payroll));
                $success++;
            } catch (\Exception $e) {
                $failures++;
                $errors[] = "Payroll #{$payroll->id}: " . $e->getMessage();
                Log::error("Bulk email failed for payroll {$payroll->id}: " . $e->getMessage());
            }
        }

        return response()->json([
            'message' => "Emails sent: {$success}, failed: {$failures}.",
            'success' => $success,
            'failures' => $failures,
            'errors' => config('app.debug') ? $errors : null,
        ]);
    }
}

<?php

namespace App\Services;

use App\Models\Payroll;
use App\Models\Branch;
use App\Models\Site;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class PayrollService
{
    /**
     * Get filtered payrolls query based on request filters
     */
    public function getFilteredPayrollsQuery(Request $request): Builder
    {
        $query = Payroll::query()
            ->with([
                'payrollPeriod',
                'employee.user',
                'employee.position',
                'employee.branch',
                'employee.branch.sites',
                'employee.site',
                'payrollItems'
            ]);

        // Apply search filter
        if ($request->filled('search')) {
            $this->applySearchFilter($query, $request->search);
        }

        // Position filter
        if ($request->filled('positions')) {
            $this->applyPositionFilter($query, $request->positions);
        }

        // Branch filter
        if ($request->filled('branches')) {
            $this->applyBranchFilter($query, $request->branches);
        }

        // Site filter
        if ($request->filled('sites')) {
            $this->applySiteFilter($query, $request->sites);
        }

        // Date range filter
        if ($request->filled('date_from') || $request->filled('date_to')) {
            $this->applyDateRangeFilter($query, $request);
        }

        return $query;
    }

    /**
     * Apply search filter to query
     */
    protected function applySearchFilter(Builder $query, string $search): void
    {
        $query->where(function ($q) use ($search) {
            $q->whereHas('employee.user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            })->orWhereHas('employee', function ($q) use ($search) {
                $q->where('emp_code', 'like', "%{$search}%");
            });
        });
    }

    /**
     * Apply position filter to query
     */
    protected function applyPositionFilter(Builder $query, string $positions): void
    {
        $positionsArray = explode(',', $positions);
        $lowerPositions = array_map('strtolower', $positionsArray);

        $query->whereHas('employee.position', function ($q) use ($lowerPositions) {
            $q->whereIn('pos_name', $lowerPositions);
        });
    }

    /**
     * Apply branch filter to query
     */
    protected function applyBranchFilter(Builder $query, string $branches): void
    {
        $branchesArray = explode(',', $branches);
        $lowerBranches = array_map('strtolower', $branchesArray);

        $query->whereHas('employee.branch', function ($q) use ($lowerBranches) {
            $q->whereIn('branch_name', $lowerBranches);
        });
    }

    /**
     * Apply site filter to query
     */
    protected function applySiteFilter(Builder $query, string $sites): void
    {
        $sitesArray = explode(',', $sites);
        $lowerSites = array_map('strtolower', $sitesArray);

        $query->whereHas('employee.site', function ($q) use ($lowerSites) {
            $q->whereIn('site_name', $lowerSites);
        });
    }

    /**
     * Apply date range filter to query
     */
    protected function applyDateRangeFilter(Builder $query, Request $request): void
    {
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

    /**
     * Get paginated filtered payrolls
     */
    public function getPaginatedFilteredPayrolls(Request $request): array
    {
        $query = $this->getFilteredPayrollsQuery($request);
        
        // Get filtered count BEFORE pagination
        $filteredCount = $query->count();
        
        // Validate and limit per page
        $perPage = $request->input('perPage', 10);
        $perPage = min(max($perPage, 1), 100);
        
        // Handle invalid page numbers
        $currentPage = $request->input('page', 1);
        $lastPage = max(1, ceil($filteredCount / $perPage));
        
        // Reset to last page if current page exceeds last page
        if ($currentPage > $lastPage && $lastPage > 0) {
            $currentPage = $lastPage;
        }
        
        // Apply pagination with validated parameters
        $payrolls = $query->paginate($perPage, ['*'], 'page', $currentPage);
        
        return [
            'payrolls' => $payrolls,
            'filteredCount' => $filteredCount,
            'perPage' => $perPage,
            'currentPage' => $currentPage,
        ];
    }

    /**
     * Get all unique positions for filter dropdown
     */
    public function getAllPositions(): array
    {
        return Payroll::query()
            ->with('employee.position')
            ->get()
            ->pluck('employee.position.pos_name')
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->toArray();
    }

    /**
     * Get all unique branches for filter dropdown
     */
    public function getAllBranches(): array
    {
        $branches = Branch::query()
            ->orderBy('branch_name')
            ->pluck('branch_name')
            ->toArray();
        
        if (empty($branches)) {
            $branches = Payroll::query()
                ->with('employee.branch')
                ->get()
                ->pluck('employee.branch.branch_name')
                ->filter()
                ->unique()
                ->sort()
                ->values()
                ->toArray();
        }
        
        return $branches;
    }

    /**
     * Get all unique sites for filter dropdown
     */
    public function getAllSites(): array
    {
        $sites = Site::query()
            ->orderBy('site_name')
            ->pluck('site_name')
            ->toArray();
        
        if (empty($sites)) {
            $sites = Payroll::query()
                ->with('employee.site')
                ->get()
                ->pluck('employee.site.site_name')
                ->filter()
                ->unique()
                ->sort()
                ->values()
                ->toArray();
        }
        
        return $sites;
    }

    /**
     * Get branches data for the filter bar (with sites)
     */
    public function getBranchesData(): array
    {
        return Branch::query()
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
    }

    /**
     * Calculate total overtime pay for a collection of payrolls
     */
    public function calculateTotalOvertimePay($payrolls): float
    {
        return $payrolls->sum(function ($payroll) {
            return $payroll->payrollItems
                ->where('type', 'earning')
                ->where('code', 'overtime')
                ->sum('amount');
        });
    }

    /**
     * Calculate total overtime hours for a collection of payrolls
     */
    public function calculateTotalOvertimeHours($payrolls): float
    {
        return $payrolls->sum(function ($payroll) {
            return $payroll->payrollItems
                ->where('type', 'earning')
                ->where('code', 'overtime_hours')
                ->sum('amount');
        });
    }

    /**
     * Calculate total deductions for a collection of payrolls
     */
    public function calculateTotalDeductions($payrolls): float
    {
        return $payrolls->sum('total_deduction');
    }

    /**
     * Calculate total net pay for a collection of payrolls
     */
    public function calculateTotalNetPay($payrolls): float
    {
        return $payrolls->sum('net_pay');
    }

    /**
     * Calculate total gross pay for a collection of payrolls
     */
    public function calculateTotalGrossPay($payrolls): float
    {
        return $payrolls->sum('gross_pay');
    }

    /**
     * Get active employees count in payroll collection
     */
    public function getActiveEmployeesInPayroll($payrolls): int
    {
        return $payrolls->count();
    }
}
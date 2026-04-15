<?php

namespace App\Services;

use App\Models\AIInsight;
use App\Models\AttendancePeriodStat;
use App\Models\Employee;
use App\Models\Payroll;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AIInsightService
{
    /**
     * Get payroll trends and anomalies
     */
    public function getPayrollInsights(int $periodId = null): array
    {
        $cacheKey = 'ai_insights_payroll_' . ($periodId ?? 'latest');
        
        return Cache::remember($cacheKey, 3600, function () use ($periodId) {
            $payrolls = $this->getPayrollData($periodId);
            
            return [
                'anomalies' => $this->detectPayrollAnomalies($payrolls),
                'trends' => $this->calculateTrends($payrolls),
                'forecast' => $this->forecastNextPeriod($payrolls),
                'recommendations' => $this->generateRecommendations($payrolls),
            ];
        });
    }
    
    /**
     * Get attendance insights - FIXED for your model (no employee relationship)
     */
    public function getAttendanceInsights(): array
    {
        $cacheKey = 'ai_insights_attendance_' . now()->format('Y-m');
        
        return Cache::remember($cacheKey, 3600, function () {
            $attendanceData = $this->getAttendanceData();
            
            if ($attendanceData->isEmpty()) {
                return [
                    'summary' => [
                        'average_attendance_rate' => 0,
                        'average_late_minutes' => 0,
                        'total_overtime_hours' => 0,
                        'total_absent_days' => 0,
                        'total_late_times' => 0,
                        'period_days' => 0,
                        'total_real_pay' => 0,
                    ],
                    'patterns' => [],
                    'anomalies' => [],
                    'recommendations' => [
                        [
                            'type' => 'opportunity',
                            'title' => 'No Attendance Data',
                            'description' => 'Import attendance data to receive AI-powered insights.',
                            'impact' => 'low',
                            'actionable' => true
                        ]
                    ],
                ];
            }
            
            return [
                'summary' => $this->generateAttendanceSummary($attendanceData),
                'patterns' => $this->detectAttendancePatterns($attendanceData),
                'anomalies' => $this->detectAttendanceAnomalies($attendanceData),
                'recommendations' => $this->generateAttendanceRecommendations($attendanceData),
            ];
        });
    }
    
    /**
     * Get attendance data - FIXED: No relationship loading
     */
    private function getAttendanceData()
    {
        // Get the latest period_start as reference
        $latestRecord = AttendancePeriodStat::latest('period_start')->first();
        
        if (!$latestRecord) {
            return collect();
        }
        
        $endDate = Carbon::parse($latestRecord->period_start)->endOfMonth();
        $startDate = $endDate->copy()->subMonths(3)->startOfMonth();
        
        // Simply get the data without eager loading relationships
        return AttendancePeriodStat::whereBetween('period_start', [$startDate, $endDate])
            ->orderBy('period_start', 'desc')
            ->get();
    }
    
    /**
     * Generate attendance summary - FIXED: Uses direct column access
     */
    private function generateAttendanceSummary($attendanceData): array
    {
        if ($attendanceData->isEmpty()) {
            return [
                'average_attendance_rate' => 0,
                'average_late_minutes' => 0,
                'total_overtime_hours' => 0,
                'total_absent_days' => 0,
                'total_late_times' => 0,
                'period_days' => 0,
                'total_real_pay' => 0,
            ];
        }
        
        // Calculate attendance rate using your model's method
        $attendanceRates = $attendanceData->map(function($record) {
            return $record->attendanceRate();
        })->filter();
        
        $avgAttendanceRate = $attendanceRates->isNotEmpty() ? $attendanceRates->avg() : 0;
        
        // Get late minutes (direct column access)
        $avgLateMinutes = $attendanceData->avg('late_minutes') ?? 0;
        
        // Calculate total overtime using your model's method
        $totalOvertime = $attendanceData->sum(function($record) {
            return $record->totalOvertimeHours();
        });
        
        return [
            'average_attendance_rate' => round($avgAttendanceRate, 2),
            'average_late_minutes' => round($avgLateMinutes, 2),
            'total_overtime_hours' => round($totalOvertime, 2),
            'total_absent_days' => round($attendanceData->sum('absent_days'), 2),
            'total_late_times' => $attendanceData->sum('late_times'),
            'period_days' => $attendanceData->count(),
            'total_real_pay' => round($attendanceData->sum('real_pay'), 2),
            'employees_analyzed' => $attendanceData->unique('employee_id')->count(),
        ];
    }
    
    /**
     * Detect patterns in attendance - FIXED: No relationship dependency
     */
    private function detectAttendancePatterns($attendanceData): array
    {
        $patterns = [];
        
        if ($attendanceData->isEmpty()) {
            return $patterns;
        }
        
        // Group by month to see trends
        $monthlyPattern = $attendanceData->groupBy(function($stat) {
            return Carbon::parse($stat->period_start)->format('Y-m');
        })->map(function($group) {
            $avgAttendanceRate = $group->avg(function($record) {
                return $record->attendanceRate();
            });
            
            return [
                'attendance_rate' => round($avgAttendanceRate, 2),
                'avg_late_minutes' => round($group->avg('late_minutes'), 2),
                'total_absent_days' => $group->sum('absent_days'),
                'employee_count' => $group->unique('employee_id')->count(),
                'total_real_pay' => round($group->sum('real_pay'), 2),
            ];
        });
        
        $patterns['monthly_trends'] = $monthlyPattern;
        
        // Find best and worst months
        if ($monthlyPattern->isNotEmpty()) {
            $bestMonth = $monthlyPattern->sortByDesc('attendance_rate')->keys()->first();
            $worstMonth = $monthlyPattern->sortBy('attendance_rate')->keys()->first();
            
            $patterns['insights'][] = [
                'type' => 'trend',
                'message' => "Best attendance was in {$bestMonth} with {$monthlyPattern[$bestMonth]['attendance_rate']}% rate",
                'best_month' => $bestMonth,
                'worst_month' => $worstMonth,
            ];
            
            // Check if attendance is improving or declining
            $trends = $monthlyPattern->values();
            if ($trends->count() >= 2) {
                $firstMonth = $trends->first();
                $lastMonth = $trends->last();
                
                if ($lastMonth['attendance_rate'] < $firstMonth['attendance_rate']) {
                    $patterns['insights'][] = [
                        'type' => 'warning',
                        'message' => "Attendance rate is declining. Compare {$firstMonth['attendance_rate']}% to {$lastMonth['attendance_rate']}%.",
                    ];
                }
            }
        }
        
        // Department analysis (if department data exists)
        $departmentPattern = $attendanceData->groupBy('department')
            ->map(function($group) {
                return [
                    'attendance_rate' => round($group->avg(function($record) {
                        return $record->attendanceRate();
                    }), 2),
                    'avg_late_minutes' => round($group->avg('late_minutes'), 2),
                    'employee_count' => $group->unique('employee_id')->count(),
                ];
            })
            ->sortByDesc('attendance_rate');
        
        if ($departmentPattern->isNotEmpty()) {
            $patterns['department_ranking'] = $departmentPattern;
            $bestDept = $departmentPattern->keys()->first();
            $patterns['insights'][] = [
                'type' => 'achievement',
                'message' => "{$bestDept} department has the highest attendance rate at {$departmentPattern[$bestDept]['attendance_rate']}%",
            ];
        }
        
        return $patterns;
    }
    
    /**
     * Detect anomalies - FIXED: Uses employee_name directly
     */
    private function detectAttendanceAnomalies($attendanceData): array
    {
        $anomalies = [];
        
        if ($attendanceData->isEmpty() || $attendanceData->count() < 3) {
            return $anomalies;
        }
        
        // Detect anomalies in late minutes per employee
        $employeeLateStats = $attendanceData->groupBy('employee_id')
            ->map(function($records, $employeeId) {
                return [
                    'employee_name' => $records->first()->employee_name,
                    'avg_late_minutes' => $records->avg('late_minutes'),
                    'max_late_minutes' => $records->max('late_minutes'),
                    'total_late_times' => $records->sum('late_times'),
                    'record_count' => $records->count(),
                ];
            });
        
        // Find employees with excessive lateness
        $highLatenessEmployees = $employeeLateStats->filter(function($stats) {
            return $stats['avg_late_minutes'] > 60;
        });
        
        foreach ($highLatenessEmployees as $employeeId => $stats) {
            $anomalies[] = [
                'type' => 'high_lateness',
                'employee_name' => $stats['employee_name'],
                'avg_late_minutes' => round($stats['avg_late_minutes'], 2),
                'total_late_times' => $stats['total_late_times'],
                'severity' => $stats['avg_late_minutes'] > 120 ? 'high' : 'medium',
                'recommendation' => 'Review attendance policy with this employee',
            ];
        }
        
        // Detect zero attendance anomalies
        $zeroAttendance = $attendanceData->filter(function($record) {
            return $record->attended_days == 0 && $record->scheduled_days > 0;
        });
        
        foreach ($zeroAttendance as $record) {
            $anomalies[] = [
                'type' => 'zero_attendance',
                'period' => Carbon::parse($record->period_start)->format('Y-m-d'),
                'employee_name' => $record->employee_name,
                'issue' => 'No attendance recorded during period',
                'scheduled_days' => $record->scheduled_days,
                'severity' => 'high',
            ];
        }
        
        // Detect unusually high overtime
        $highOvertime = $attendanceData->filter(function($record) {
            return $record->totalOvertimeHours() > 40; // More than 40 hours overtime
        });
        
        foreach ($highOvertime as $record) {
            $anomalies[] = [
                'type' => 'high_overtime',
                'period' => Carbon::parse($record->period_start)->format('Y-m-d'),
                'employee_name' => $record->employee_name,
                'overtime_hours' => $record->totalOvertimeHours(),
                'severity' => $record->totalOvertimeHours() > 60 ? 'high' : 'medium',
                'recommendation' => 'Review workload distribution',
            ];
        }
        
        return $anomalies;
    }
    
    /**
     * Generate recommendations - FIXED: Uses your model's methods
     */
    private function generateAttendanceRecommendations($attendanceData): array
    {
        $recommendations = [];
        
        if ($attendanceData->isEmpty()) {
            return $recommendations;
        }
        
        $avgLateMinutes = $attendanceData->avg('late_minutes') ?? 0;
        $totalOvertime = $attendanceData->sum(function($record) {
            return $record->totalOvertimeHours();
        });
        $totalAbsentDays = $attendanceData->sum('absent_days') ?? 0;
        $avgAttendanceRate = $attendanceData->avg(function($record) {
            return $record->attendanceRate();
        });
        
        // Late minutes recommendations
        if ($avgLateMinutes > 60) {
            $recommendations[] = [
                'type' => 'productivity',
                'title' => 'Critical Lateness Issue',
                'description' => "Average lateness of " . round($avgLateMinutes) . " minutes per period. Immediate action required: Implement attendance monitoring system and consider flexible hours.",
                'impact' => 'high',
                'actionable' => true
            ];
        } elseif ($avgLateMinutes > 30) {
            $recommendations[] = [
                'type' => 'productivity',
                'title' => 'High Lateness Detected',
                'description' => "Average lateness of " . round($avgLateMinutes) . " minutes. Consider implementing an attendance incentive program.",
                'impact' => 'medium',
                'actionable' => true
            ];
        }
        
        // Overtime recommendations
        if ($totalOvertime > 500) {
            $recommendations[] = [
                'type' => 'cost_saving',
                'title' => 'Excessive Overtime Costs',
                'description' => "Total overtime of {$totalOvertime} hours. Consider hiring additional staff or redistributing workload.",
                'impact' => 'high',
                'actionable' => true
            ];
        } elseif ($totalOvertime > 200) {
            $recommendations[] = [
                'type' => 'cost_saving',
                'title' => 'High Overtime Usage',
                'description' => "Total overtime of {$totalOvertime} hours. Review if this is seasonal or requires permanent staffing adjustment.",
                'impact' => 'medium',
                'actionable' => true
            ];
        }
        
        // Attendance rate recommendations
        if ($avgAttendanceRate < 85) {
            $recommendations[] = [
                'type' => 'risk',
                'title' => 'Low Attendance Rate',
                'description' => "Average attendance rate of {$avgAttendanceRate}%. Investigate causes: health issues, job satisfaction, or commuting problems.",
                'impact' => 'high',
                'actionable' => true
            ];
        } elseif ($avgAttendanceRate < 90) {
            $recommendations[] = [
                'type' => 'opportunity',
                'title' => 'Moderate Attendance Rate',
                'description' => "Attendance rate at {$avgAttendanceRate}%. Consider recognition program for perfect attendance.",
                'impact' => 'medium',
                'actionable' => true
            ];
        }
        
        // Absent days recommendations
        if ($totalAbsentDays > 100) {
            $recommendations[] = [
                'type' => 'risk',
                'title' => 'High Absenteeism',
                'description' => "Total absent days: {$totalAbsentDays}. Review leave policies and conduct stay interviews.",
                'impact' => 'high',
                'actionable' => true
            ];
        }
        
        return $recommendations;
    }
    
    /**
     * Get payroll data for the specified period
     */
    private function getPayrollData(int $periodId = null)
    {
        // Use camelCase relationship + anchor on latest, same pattern as attendance
        $query = Payroll::with('employee', 'payrollPeriod');

        if ($periodId) {
            $query->where('payroll_period_id', $periodId);
        }

        return $query->get();
    }
    
    /**
     * Detect anomalies using statistical methods
     */
    private function detectPayrollAnomalies($payrolls): array
    {
        // Use gross_pay instead of total_amount
        $amounts = $payrolls->pluck('gross_pay')->filter()->toArray();

        if (count($amounts) < 3) {
            return [];
        }

        $mean     = array_sum($amounts) / count($amounts);
        $variance = array_sum(array_map(fn($x) => pow($x - $mean, 2), $amounts)) / count($amounts);
        $stdDev   = sqrt($variance);

        $anomalies = [];
        foreach ($payrolls as $payroll) {
            if ($payroll->gross_pay && $stdDev > 0) {
                $zScore = abs($payroll->gross_pay - $mean) / $stdDev;

                if ($zScore > 2) {
                    $anomalies[] = [
                        'employee_id'    => $payroll->employee_id,
                        'employee_name'  => $payroll->employee->full_name ?? $payroll->employee->name ?? 'Unknown',
                        'gross_pay'      => $payroll->gross_pay,
                        'net_pay'        => $payroll->net_pay,
                        'total_deduction'=> $payroll->total_deduction,
                        'expected_range' => [
                            'min' => round($mean - $stdDev, 2),
                            'max' => round($mean + $stdDev, 2),
                        ],
                        'severity' => $zScore > 3 ? 'high' : 'medium',
                        'reason'   => $this->explainAnomaly($payroll, $mean, $stdDev),
                    ];
                }
            }
        }

        return $anomalies;
    }
    
    /**
     * Calculate trends using linear regression
     */
    private function calculateTrends($payrolls): array
    {
        $trends = [];

        if ($payrolls->isEmpty()) {
            return $trends;
        }

        // Guard against null payrollPeriod before grouping
        $validPayrolls = $payrolls->filter(fn($p) => $p->payrollPeriod !== null);

        if ($validPayrolls->isEmpty()) {
            return $trends;
        }

        $monthlyData = $validPayrolls->groupBy(function($payroll) {
            return Carbon::parse($payroll->payrollPeriod->start_date)->format('Y-m');
        });

        foreach ($monthlyData as $month => $periodPayrolls) {
            $trends[] = [
                'month'          => $month,
                'total_payroll'  => $periodPayrolls->sum('gross_pay'),   // was total_amount
                'average_salary' => round($periodPayrolls->avg('gross_pay'), 2),  // was total_amount
                'employee_count' => $periodPayrolls->count(),
                'growth_rate'    => $this->calculateGrowthRate($monthlyData, $month),
            ];
        }

        return $trends;
    }
    
    /**
     * Generate recommendations from payroll data
     */
    private function generateRecommendations($payrolls): array
    {
        $recommendations = [];

        if ($payrolls->isEmpty()) {
            return $recommendations;
        }

        // Use the correct columns: gross_pay and net_pay
        $totalGross   = $payrolls->sum('gross_pay');
        $totalNet     = $payrolls->sum('net_pay');
        $avgGross     = $payrolls->avg('gross_pay') ?? 0;
        $avgNet       = $payrolls->avg('net_pay') ?? 0;
        $totalDeduct  = $payrolls->sum('total_deduction');
        $count        = $payrolls->count();

        // Baseline overview — always generated
        $recommendations[] = [
            'type'        => 'opportunity',
            'title'       => 'Payroll Period Overview',
            'description' => "Processed {$count} payroll records. Total gross: PHP " . number_format($totalGross, 2) .
                            ". Total net pay: PHP " . number_format($totalNet, 2) . ".",
            'impact'      => 'medium',
            'actionable'  => false,
        ];

        // Flag employees with negative net pay (like employee_id 23 with -4981.00)
        $negativeNetPay = $payrolls->filter(fn($p) => $p->net_pay < 0);
        if ($negativeNetPay->count() > 0) {
            $recommendations[] = [
                'type'        => 'risk',
                'title'       => 'Employees With Negative Net Pay',
                'description' => $negativeNetPay->count() . " employee(s) have negative net pay this period — deductions exceed gross pay. Review contribution settings.",
                'impact'      => 'high',
                'actionable'  => true,
            ];
        }

        // High deduction ratio
        $deductionRatio = $totalGross > 0 ? ($totalDeduct / $totalGross) * 100 : 0;
        if ($deductionRatio > 50) {
            $recommendations[] = [
                'type'        => 'risk',
                'title'       => 'High Deduction Ratio',
                'description' => "Deductions are " . round($deductionRatio) . "% of gross pay (PHP " . number_format($totalDeduct, 2) . "). Verify contribution brackets are correctly configured.",
                'impact'      => 'high',
                'actionable'  => true,
            ];
        }

        // Payroll variance check
        $grossAmounts = $payrolls->pluck('gross_pay')->filter()->toArray();
        if (count($grossAmounts) >= 3) {
            $mean   = array_sum($grossAmounts) / count($grossAmounts);
            $stdDev = sqrt(array_sum(array_map(fn($x) => pow($x - $mean, 2), $grossAmounts)) / count($grossAmounts));
            $cv     = $mean > 0 ? ($stdDev / $mean) * 100 : 0;

            if ($cv > 40) {
                $recommendations[] = [
                    'type'        => 'risk',
                    'title'       => 'High Payroll Variance',
                    'description' => "Gross pay varies significantly across employees (CV: " . round($cv) . "%). Review for inconsistent pay structures.",
                    'impact'      => 'high',
                    'actionable'  => true,
                ];
            }
        }

        return $recommendations;
    }
    
    /**
     * Explain the reason for an anomaly
     */
    private function explainAnomaly($payroll, $mean, $stdDev): string
    {
        // Fixed to use gross_pay
        $percentageDiff = (($payroll->gross_pay - $mean) / ($mean ?: 1)) * 100;
        return "Gross pay is " . round(abs($percentageDiff)) . "% " .
            ($percentageDiff > 0 ? "above" : "below") . " company average.";
    }
    
    /**
     * Calculate growth rate between months
     */
    private function calculateGrowthRate($monthlyData, $currentMonth): float
    {
        $months = $monthlyData->keys()->sort()->values()->toArray();
        $currentIndex = array_search($currentMonth, $months);
        
        if ($currentIndex === false || $currentIndex === 0) {
            return 0;
        }
        
        $previousMonth = $months[$currentIndex - 1];
        $currentTotal = $monthlyData[$currentMonth]->sum('total_amount');
        $previousTotal = $monthlyData[$previousMonth]->sum('total_amount');
        
        return $previousTotal > 0 ? round((($currentTotal - $previousTotal) / $previousTotal) * 100, 2) : 0;
    }
    
    /**
     * Forecast next period payroll
     */
    private function forecastNextPeriod($payrolls): array
    {
        if ($payrolls->isEmpty()) {
            return [
                'forecasted_total' => 0,
                'confidence' => 'low',
                'note' => 'Insufficient data for forecasting'
            ];
        }
        
        $amounts = $payrolls->pluck('total_amount')->filter()->toArray();
        
        if (empty($amounts)) {
            return [
                'forecasted_total' => 0,
                'confidence' => 'low',
                'note' => 'No valid payroll amounts found'
            ];
        }
        
        $average = array_sum($amounts) / count($amounts);
        
        // Simple 2% growth assumption
        $forecastedTotal = $average * 1.02;
        
        return [
            'forecasted_total' => round($forecastedTotal, 2),
            'confidence' => count($amounts) > 6 ? 'high' : 'medium',
            'note' => 'Based on historical average with 2% growth assumption',
            'historical_average' => round($average, 2)
        ];
    }

    /**
     * Store insights to database
     */
    public function storeInsights($data, string $type): void
    {
        // Handle different data structures
        $insights = [];
        
        if ($type === 'attendance') {
            // Extract recommendations
            if (isset($data['recommendations']) && is_array($data['recommendations'])) {
                foreach ($data['recommendations'] as $rec) {
                    $insights[] = [
                        'type' => 'attendance',
                        'title' => $rec['title'] ?? 'Attendance Recommendation',
                        'description' => $rec['description'] ?? '',
                        'impact' => $rec['impact'] ?? 'medium',
                        'actionable' => $rec['actionable'] ?? true,
                        'metadata' => ['source' => 'attendance_recommendation'],
                    ];
                }
            }
            
            // Extract anomalies as separate insights
            if (isset($data['anomalies']) && is_array($data['anomalies'])) {
                foreach ($data['anomalies'] as $anomaly) {
                    $title = $this->getAnomalyTitle($anomaly);
                    $description = $this->getAnomalyDescription($anomaly);
                    
                    $insights[] = [
                        'type' => 'anomaly',
                        'title' => $title,
                        'description' => $description,
                        'impact' => $anomaly['severity'] ?? 'high',
                        'actionable' => true,
                        'metadata' => $anomaly,
                    ];
                }
            }
            
            // Extract department insights
            if (isset($data['patterns']['department_ranking']) && is_array($data['patterns']['department_ranking'])) {
                foreach ($data['patterns']['department_ranking'] as $dept => $stats) {
                    $insights[] = [
                        'type' => 'attendance',
                        'title' => "{$dept} Department Performance",
                        'description' => "{$dept} department has {$stats['attendance_rate']}% attendance rate with average lateness of {$stats['avg_late_minutes']} minutes.",
                        'impact' => $stats['attendance_rate'] < 80 ? 'high' : 'medium',
                        'actionable' => $stats['attendance_rate'] < 80,
                        'metadata' => ['department' => $dept, 'stats' => $stats],
                    ];
                }
            }
            
            // Extract monthly trends
            if (isset($data['patterns']['monthly_trends']) && is_array($data['patterns']['monthly_trends'])) {
                foreach ($data['patterns']['monthly_trends'] as $month => $trend) {
                    $insights[] = [
                        'type' => 'trend',
                        'title' => "Monthly Trend: {$month}",
                        'description' => "Attendance rate: {$trend['attendance_rate']}%, Late minutes: {$trend['avg_late_minutes']}, Absent days: {$trend['total_absent_days']}",
                        'impact' => $trend['attendance_rate'] < 80 ? 'high' : 'medium',
                        'actionable' => false,
                        'metadata' => ['month' => $month, 'trend' => $trend],
                    ];
                }
            }
        }
        
        if ($type === 'payroll') {
            if (isset($data['recommendations']) && is_array($data['recommendations'])) {
                foreach ($data['recommendations'] as $rec) {
                    $insights[] = [
                        'type' => 'payroll',
                        'title' => $rec['title'] ?? 'Payroll Recommendation',
                        'description' => $rec['description'] ?? '',
                        'impact' => $rec['impact'] ?? 'medium',
                        'actionable' => $rec['actionable'] ?? true,
                        'metadata' => ['source' => 'payroll_recommendation'],
                    ];
                }
            }
            
            if (isset($data['anomalies']) && is_array($data['anomalies'])) {
                foreach ($data['anomalies'] as $anomaly) {
                    $insights[] = [
                        'type' => 'anomaly',
                        'title' => "Payroll Anomaly: {$anomaly['employee_name']}",
                        'description' => $anomaly['reason'] ?? "Payroll amount differs from expected range",
                        'impact' => $anomaly['severity'] ?? 'medium',
                        'actionable' => true,
                        'metadata' => $anomaly,
                    ];
                }
            }
        }
        
        // Store each insight
        foreach ($insights as $insight) {
            AIInsight::updateOrCreate(
                [
                    'type' => $insight['type'],
                    'title' => $insight['title'],
                    'analyzed_at' => now()->startOfDay(),
                ],
                [
                    'description' => $insight['description'],
                    'impact' => $insight['impact'],
                    'actionable' => $insight['actionable'],
                    'metadata' => $insight['metadata'] ?? [],
                    'analyzed_at' => now(),
                ]
            );
        }
    }

    /**
     * Get anomaly title based on type
     */
    private function getAnomalyTitle(array $anomaly): string
    {
        if (isset($anomaly['type'])) {
            switch ($anomaly['type']) {
                case 'high_lateness':
                    return "High Lateness: {$anomaly['employee_name']}";
                case 'zero_attendance':
                    return "Zero Attendance: {$anomaly['employee_name']}";
                case 'high_overtime':
                    return "High Overtime: {$anomaly['employee_name']}";
                default:
                    return "Anomaly Detected: {$anomaly['employee_name']}";
            }
        }
        return "Attendance Anomaly Detected";
    }

    /**
     * Get anomaly description based on type
     */
    private function getAnomalyDescription(array $anomaly): string
    {
        if (isset($anomaly['type'])) {
            switch ($anomaly['type']) {
                case 'high_lateness':
                    return "Employee has {$anomaly['avg_late_minutes']} average late minutes across {$anomaly['total_late_times']} occurrences. {$anomaly['recommendation']}";
                case 'zero_attendance':
                    return "No attendance recorded during period {$anomaly['period']}. Scheduled {$anomaly['scheduled_days']} days but zero attendance.";
                case 'high_overtime':
                    return "Employee accumulated {$anomaly['overtime_hours']} overtime hours. {$anomaly['recommendation']}";
                default:
                    return "Attendance anomaly detected. Please review employee records.";
            }
        }
        return "Anomaly detected in attendance records.";
    }



    /**
     * Get stored insights from database
     */
    public function getStoredInsights(string $type = null, int $limit = 10): array
    {
        $query = AIInsight::query();
        
        if ($type) {
            $query->ofType($type);
        }
        
        return $query->orderBy('analyzed_at', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Generate and store all insights
     */
    public function generateAndStoreAllInsights(): array
    {
        $allInsights = [];
        
        // Get and store attendance insights (with all sub-types)
        $attendanceData = $this->getAttendanceInsights();
        $this->storeInsights($attendanceData, 'attendance');
        $allInsights['attendance'] = $attendanceData;
        
        // Get and store payroll insights
        $payrollData = $this->getPayrollInsights();
        $this->storeInsights($payrollData, 'payroll');
        $allInsights['payroll'] = $payrollData;
        
        return $allInsights;
    }
}
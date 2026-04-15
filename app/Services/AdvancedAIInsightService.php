<?php

namespace App\Services;

use App\Models\AttendancePeriodStat;
use App\Models\Employee;
use App\Models\Payroll;
use Carbon\Carbon;
use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Log;

class AdvancedAIInsightService extends AIInsightService
{
    /**
     * Generate natural language executive summary
     */
    public function generateExecutiveSummary(): string
    {
        $data = $this->gatherKeyMetrics();
        
        $prompt = $this->buildInsightPrompt($data);
        
        try {
            $response = OpenAI::chat()->create([
                'model' => 'gpt-3.5-turbo', // or 'gpt-4' for better quality
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an HR analytics expert. Provide concise, actionable insights.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.7,
                'max_tokens' => 500,
            ]);
            
            return $response->choices[0]->message->content;
            
        } catch (\Exception $e) {
            Log::error('OpenAI API error: ' . $e->getMessage());
            return $this->getFallbackInsights($data);
        }
    }
    
    /**
     * Build prompt with your data
     */
    private function buildInsightPrompt(array $data): string
    {
        return <<<PROMPT
Analyze this payroll/HR data and provide 3 key insights:

Payroll Metrics:
- Total payroll this month: PHP {$data['total_payroll']}
- Average salary: PHP {$data['average_salary']}
- Payroll growth vs last month: {$data['growth_rate']}%

Attendance Metrics:
- Average attendance rate: {$data['attendance_rate']}%
- Total overtime hours: {$data['overtime_hours']}
- Average lateness: {$data['avg_lateness']} minutes

Employee Metrics:
- Total active employees: {$data['total_employees']}
- New hires this month: {$data['new_hires']}
- Turnover rate: {$data['turnover_rate']}%

Provide:
1. One cost-saving opportunity
2. One productivity improvement suggestion
3. One risk factor to watch

Keep each insight under 2 sentences.
PROMPT;
    }

    /**
     * Gather key metrics data
     */
    private function gatherKeyMetrics(): array
    {
        // Get actual data from your database
        $lastMonth = Carbon::now()->subMonth();
        $currentMonth = Carbon::now();
        
        // Payroll metrics
        $totalPayroll = Payroll::whereBetween('created_at', [$lastMonth, $currentMonth])
            ->sum('total_amount') ?? 0;
        
        $averageSalary = Employee::with('user')
            ->get()
            ->avg(function($employee) {
                return $employee->position->salary ?? 0;
            }) ?? 0;
        
        // Attendance metrics
        $attendanceRate = AttendancePeriodStat::whereBetween('date', [$lastMonth, $currentMonth])
            ->avg('attendance_rate') ?? 0;
        
        $overtimeHours = AttendancePeriodStat::whereBetween('date', [$lastMonth, $currentMonth])
            ->sum('overtime_hours') ?? 0;
        
        $avgLateness = AttendancePeriodStat::whereBetween('date', [$lastMonth, $currentMonth])
            ->avg('late_minutes') ?? 0;
        
        // Employee metrics
        $totalEmployees = Employee::count();
        $newHires = Employee::whereBetween('created_at', [$lastMonth, $currentMonth])->count();
        
        // Calculate turnover rate (employees who left in last 3 months)
        $threeMonthsAgo = Carbon::now()->subMonths(3);
        $employeesLeft = Employee::where('termination_date', '>=', $threeMonthsAgo)
            ->where('termination_date', '<=', Carbon::now())
            ->count();
        $turnoverRate = $totalEmployees > 0 ? ($employeesLeft / $totalEmployees) * 100 : 0;
        
        // Calculate growth rate (compare with previous month)
        $previousMonthPayroll = Payroll::whereBetween('created_at', [
            Carbon::now()->subMonths(2), Carbon::now()->subMonth()
        ])->sum('total_amount') ?? 1;
        
        $growthRate = (($totalPayroll - $previousMonthPayroll) / $previousMonthPayroll) * 100;
        
        return [
            'total_payroll' => $totalPayroll,
            'average_salary' => round($averageSalary, 2),
            'growth_rate' => round($growthRate, 2),
            'attendance_rate' => round($attendanceRate, 2),
            'overtime_hours' => round($overtimeHours, 2),
            'avg_lateness' => round($avgLateness, 2),
            'total_employees' => $totalEmployees,
            'new_hires' => $newHires,
            'turnover_rate' => round($turnoverRate, 2),
        ];
    }

    /**
     * Provide fallback insights when OpenAI API fails
     */
    private function getFallbackInsights(array $data): string
    {
        return "Fallback Insights: Total payroll is PHP {$data['total_payroll']}, average attendance is {$data['attendance_rate']}%, and total employees are {$data['total_employees']}. Monitor overtime and turnover for potential improvements.";
    }
}
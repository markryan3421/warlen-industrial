<?php

namespace App\Services;

use App\Models\ContributionVersion;
use App\Models\EmployeeContributionSetting;
use Illuminate\Support\Facades\Log;

class ContributionService
{
    /**
     * Calculate government contributions (SSS, Pag-IBIG, PhilHealth) based on salary range and employee settings
     */
    public function calculateGovernmentContributions(float $grossPay, ?int $employeeId = null): array
    {
        // Initialize contributions array
        $contributions = [
            'sss' => ['employee' => 0, 'employer' => 0],
            'pagibig' => ['employee' => 0, 'employer' => 0],
            'philhealth' => ['employee' => 0, 'employer' => 0],
        ];

        // If gross pay is 0, return zero contributions immediately
        if ($grossPay <= 0) {
            Log::info("Gross pay is zero, skipping all contribution calculations");
            return $contributions;
        }

        try {
            // Get the latest contribution versions
            $sssVersion = ContributionVersion::where('type', 'sss')->first();
            $pagibigVersion = ContributionVersion::where('type', 'pagibig')->first();
            $philhealthVersion = ContributionVersion::where('type', 'philhealth')->first();

            // Calculate SSS (using brackets)
            if ($sssVersion) {
                $contributions['sss'] = $this->calculateContributionWithEmployeeSettings($sssVersion, $grossPay, 'SSS', $employeeId);
            }

            // Calculate Pag-IBIG (using fixed amount from settings)
            if ($pagibigVersion) {
                $contributions['pagibig'] = $this->calculateContributionWithEmployeeSettings($pagibigVersion, $grossPay, 'Pag-IBIG', $employeeId);
            }

            // Calculate PhilHealth (using percentage from settings)
            if ($philhealthVersion) {
                $contributions['philhealth'] = $this->calculatePhilHealthContribution($philhealthVersion, $grossPay, $employeeId);
            }

        } catch (\Exception $e) {
            Log::error("Error calculating government contributions: " . $e->getMessage());
        }

        return $contributions;
    }

    /**
     * Calculate PhilHealth contribution (percentage-based)
     */
    private function calculatePhilHealthContribution($version, float $grossPay, ?int $employeeId): array
    {
        $result = ['employee' => 0, 'employer' => 0];
        
        // Skip calculation if gross pay is 0
        if ($grossPay <= 0) {
            Log::info("PhilHealth calculation skipped: gross pay is zero");
            return $result;
        }
        
        $defaultRate = 5.00; // Default 5% total (2.5% employee, 2.5% employer)
        
        // Check if employee has settings for PhilHealth
        if ($employeeId) {
            $employeeSetting = EmployeeContributionSetting::where('employee_id', $employeeId)
                ->where('contribution_version_id', $version->id)
                ->first();
            
            // If employee is exempted, return zero contributions
            if ($employeeSetting && $employeeSetting->is_exempted === true) {
                Log::info("PhilHealth exempted for employee ID: {$employeeId}");
                return $result;
            }
            
            // Check if fixed_amount is set (this will be used as percentage rate)
            if ($employeeSetting && $employeeSetting->fixed_amount !== null) {
                $rate = (float) $employeeSetting->fixed_amount;
                // Calculate total contribution based on percentage rate
                $totalContribution = round($grossPay * ($rate / 100), 2);
                // Split equally between employee and employer (50% each)
                $result = [
                    'employee' => round($totalContribution / 2, 2),
                    'employer' => round($totalContribution / 2, 2),
                ];
                
                Log::info("PhilHealth Percentage Calculation:", [
                    'employee_id' => $employeeId,
                    'rate' => $rate . '%',
                    'gross_pay' => $grossPay,
                    'total_contribution' => $totalContribution,
                    'employee_amount' => $result['employee'],
                    'employer_amount' => $result['employer']
                ]);
                
                return $result;
            }
        }
        
        // Use default 5% if no employee setting or no fixed_amount
        $totalContribution = round($grossPay * ($defaultRate / 100), 2);
        $result = [
            'employee' => round($totalContribution / 2, 2),
            'employer' => round($totalContribution / 2, 2),
        ];
        
        Log::info("PhilHealth Default 5% Calculation:", [
            'gross_pay' => $grossPay,
            'rate' => $defaultRate . '%',
            'total_contribution' => $totalContribution,
            'employee_amount' => $result['employee'],
            'employer_amount' => $result['employer']
        ]);
        
        return $result;
    }

    /**
     * Calculate contribution for a specific version with employee settings
     */
    private function calculateContributionWithEmployeeSettings($version, float $grossPay, string $type, ?int $employeeId): array
    {
        $result = ['employee' => 0, 'employer' => 0];
        
        // Skip calculation if gross pay is 0
        if ($grossPay <= 0) {
            Log::info("{$type} calculation skipped: gross pay is zero");
            return $result;
        }
        
        // Check if employee has settings for this contribution
        if ($employeeId) {
            $employeeSetting = EmployeeContributionSetting::where('employee_id', $employeeId)
                ->where('contribution_version_id', $version->id)
                ->first();
            
            // If employee is exempted, return zero contributions
            if ($employeeSetting && $employeeSetting->is_exempted === true) {
                Log::info("{$type} exempted for employee ID: {$employeeId}");
                return $result;
            }
            
            // For Pag-IBIG, check if fixed_amount is set
            if ($version->type === 'pagibig' && $employeeSetting && $employeeSetting->fixed_amount !== null) {
                // Use fixed amount from employee settings
                $fixedAmount = (float) $employeeSetting->fixed_amount;
                $result = [
                    'employee' => $fixedAmount,
                    'employer' => $fixedAmount, // Employer matches employee for Pag-IBIG
                ];
                
                Log::info("{$type} Fixed Amount Calculation:", [
                    'employee_id' => $employeeId,
                    'fixed_amount' => $fixedAmount,
                    'employee_amount' => $result['employee'],
                    'employer_amount' => $result['employer']
                ]);
                
                return $result;
            }
        }
        
        // For SSS or when no fixed amount is set, use bracket calculation
        return $this->calculateContribution($version, $grossPay, $type);
    }

    /**
     * Calculate contribution for a specific version using brackets
     */
    private function calculateContribution($version, float $grossPay, string $type): array
    {
        $result = ['employee' => 0, 'employer' => 0];
        
        // Skip calculation if gross pay is 0
        if ($grossPay <= 0) {
            return $result;
        }
        
        $bracket = $version->contributionBrackets()
            ->where('salary_from', '<=', $grossPay)
            ->where('salary_to', '>=', $grossPay)
            ->first();
        
        if ($bracket) {
            // Convert percentage to actual amount
            $employeePercentage = (float) $bracket->employee_share;
            $employerPercentage = (float) $bracket->employer_share;
            
            $result = [
                'employee' => round($grossPay * ($employeePercentage / 100), 2),
                'employer' => round($grossPay * ($employerPercentage / 100), 2),
            ];
        } else {
            // If salary is outside all brackets, use the nearest bracket
            $nearestBracket = $this->findNearestBracket($version, $grossPay);
            if ($nearestBracket) {
                $employeePercentage = (float) $nearestBracket->employee_share;
                $employerPercentage = (float) $nearestBracket->employer_share;
                
                $result = [
                    'employee' => round($grossPay * ($employeePercentage / 100), 2),
                    'employer' => round($grossPay * ($employerPercentage / 100), 2),
                ];
            }
        }
        
        Log::info("{$type} Bracket Calculation:", [
            'gross_pay' => $grossPay,
            'employee_amount' => $result['employee'],
            'employer_amount' => $result['employer']
        ]);

        return $result;
    }

    /**
     * Find the nearest contribution bracket for a given salary
     */
    private function findNearestBracket($version, float $salary)
    {
        // Try to find the bracket with salary_to closest to the given salary
        $bracket = $version->contributionBrackets()
            ->orderByRaw('ABS(salary_to - ?)', [$salary])
            ->first();
        
        return $bracket;
    }
}